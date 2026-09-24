import { Colaborador, RegistroPonto, TipoEvento } from '../types';

/**
 * Converte string "HH:mm" para minutos a partir da meia-noite
 */
export function horarioParaMinutos(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converte minutos para string "HH:mm"
 */
export function minutosParaHorario(totalMinutos: number): string {
  const h = Math.floor(Math.abs(totalMinutos) / 60);
  const m = Math.abs(totalMinutos) % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Obtém o horário agendado de acordo com o turno e o tipo de evento
 */
export function obterHorarioEsperado(colaborador: Colaborador, tipo: TipoEvento): string {
  switch (tipo) {
    case 'entrada':
      return colaborador.turno.entrada;
    case 'saida_intervalo':
      return colaborador.turno.saidaIntervalo;
    case 'retorno_intervalo':
      return colaborador.turno.retornoIntervalo;
    case 'saida_fim':
      return colaborador.turno.saidaFim;
  }
}

/**
 * RN-01: Tolerância de 5 minutos por marcação, respeitando o limite diário de 10 minutos acumulados.
 * Calcula o desvio da marcação atual em relação ao horário previsto do turno.
 */
export function verificarToleranciaMarcação(
  colaborador: Colaborador,
  tipo: TipoEvento,
  horarioAtual: string, // "HH:mm"
  registrosDoDia: RegistroPonto[]
): {
  dentroTolerancia: boolean;
  minutosDesvio: number; // positivo se atrasado/estourado, negativo se adiantado
  exigeJustificativa: boolean;
  motivoTolerancia: string;
  acumuladoMinutosHoje: number;
} {
  const horarioEsperado = obterHorarioEsperado(colaborador, tipo);
  const minEsperado = horarioParaMinutos(horarioEsperado);
  const minAtual = horarioParaMinutos(horarioAtual);

  let desvio = 0;

  // Lógica de atraso ou desvio por tipo de evento
  if (tipo === 'entrada') {
    // Se marcou depois do previsto -> atraso
    desvio = minAtual - minEsperado;
  } else if (tipo === 'saida_intervalo') {
    // Saída antes do previsto ou depois
    desvio = minAtual - minEsperado;
  } else if (tipo === 'retorno_intervalo') {
    // Retorno tardio -> atraso
    desvio = minAtual - minEsperado;
  } else if (tipo === 'saida_fim') {
    // Saída antecipada se minAtual < minEsperado
    desvio = minEsperado - minAtual; // se positivo = saiu antes da hora
  }

  // Desvios absolutos pontuais
  const desvioPontualAbsoluto = Math.abs(desvio);

  // Calcula quanto já foi acumulado hoje por registros anteriores fora da tolerância
  const acumuladoAnterior = registrosDoDia.reduce((acc, reg) => {
    return acc + Math.abs(reg.minutosDesvio || 0);
  }, 0);

  const acumuladoTotal = acumuladoAnterior + (desvio > 0 ? desvio : 0);

  // Regra RN-01:
  // Tolerância individual de até 5 minutos por batida.
  // Tolerância diária máxima acumulada de 10 minutos.
  const dentroToleranciaPontual = desvioPontualAbsoluto <= 5;
  const dentroToleranciaAcumulada = acumuladoTotal <= 10;

  const dentroToleranciaGeral = dentroToleranciaPontual && dentroToleranciaAcumulada;

  let motivoTolerancia = 'Horário regular dentro da tolerância legal de 5 minutos.';
  let exigeJustificativa = false;

  if (desvio > 5) {
    exigeJustificativa = true;
    motivoTolerancia = `Variação de ${desvio} min excede a tolerância individual de 5 minutos (Horário previsto: ${horarioEsperado}).`;
  } else if (tipo === 'saida_fim' && desvio > 5) {
    exigeJustificativa = true;
    motivoTolerancia = `Saída antecipada em ${desvio} minutos do horário contratual (${horarioEsperado}).`;
  } else if (acumuladoTotal > 10) {
    exigeJustificativa = true;
    motivoTolerancia = `Variação acumulada diária atingiu ${acumuladoTotal} min, ultrapassando o limite legal de 10 minutos diários (Art. 58 CLT).`;
  }

  return {
    dentroTolerancia: dentroToleranciaGeral,
    minutosDesvio: desvio,
    exigeJustificativa,
    motivoTolerancia,
    acumuladoMinutosHoje: acumuladoTotal,
  };
}

/**
 * RN-02: Desconto e Horas Excedentes
 * Ultrapassada a tolerância diária de 10 minutos, todo o tempo excedente é contabilizado para desconto em folha.
 */
export function calcularDescontoDiario(registrosDoDia: RegistroPonto[]): {
  minutosAcumulados: number;
  minutosDesconto: number;
  temDesconto: boolean;
} {
  const minutosAcumulados = registrosDoDia.reduce((acc, reg) => {
    return acc + (reg.minutosDesvio > 0 ? reg.minutosDesvio : 0);
  }, 0);

  // Se passou de 10 minutos acumulados no dia, todo o tempo excedente (ou total dependendo do cômputo integral)
  // Conforme Súmula 366 do TST: "ultrapassado o limite de 10 minutos diários, será considerada como extra a totalidade do tempo que exceder a jornada normal"
  // e inversamente para atrasos: desconta-se a totalidade dos atrasos.
  const temDesconto = minutosAcumulados > 10;
  const minutosDesconto = temDesconto ? minutosAcumulados : 0;

  return {
    minutosAcumulados,
    minutosDesconto,
    temDesconto,
  };
}

/**
 * RN-03: Imutabilidade do Registro com carimbo de tempo UTC e Hash SHA-256
 */
export async function gerarHashIntegridade(
  nsr: number,
  colaboradorPis: string,
  timestampUtc: string,
  tipoEvento: string
): Promise<string> {
  const dados = `${nsr}|${colaboradorPis}|${timestampUtc}|${tipoEvento}|PONTOTECH_AUTH_KEY_2026`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dados);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    // Fallback pseudo-hash determinístico se crypto.subtle falhar em contexto não seguro
    let hash = 0;
    for (let i = 0; i < dados.length; i++) {
      hash = ((hash << 5) - hash) + dados.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(64, '0');
  }
}

/**
 * Determina o próximo tipo de evento recomendado com base nos registros já feitos hoje
 */
export function determinarProximoEvento(registrosHoje: RegistroPonto[]): TipoEvento {
  if (registrosHoje.length === 0) return 'entrada';
  const tipos = registrosHoje.map(r => r.tipoEvento);
  if (!tipos.includes('entrada')) return 'entrada';
  if (!tipos.includes('saida_intervalo')) return 'saida_intervalo';
  if (!tipos.includes('retorno_intervalo')) return 'retorno_intervalo';
  if (!tipos.includes('saida_fim')) return 'saida_fim';
  return 'entrada';
}

/**
 * Rótulo amigável para os tipos de evento
 */
export function getLabelEvento(tipo: TipoEvento): string {
  switch (tipo) {
    case 'entrada':
      return 'Entrada';
    case 'saida_intervalo':
      return 'Saída Intervalo';
    case 'retorno_intervalo':
      return 'Retorno Intervalo';
    case 'saida_fim':
      return 'Saída Expediente';
  }
}
