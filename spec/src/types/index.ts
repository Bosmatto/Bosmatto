export type TipoEvento = 'entrada' | 'saida_intervalo' | 'retorno_intervalo' | 'saida_fim';

export type MetodoAutenticacao = 'biometria_facial' | 'rfid' | 'pin';

export interface Turno {
  nome: string;
  entrada: string; // "08:00"
  saidaIntervalo: string; // "12:00"
  retornoIntervalo: string; // "13:00"
  saidaFim: string; // "17:00"
}

export interface Colaborador {
  id: string;
  nome: string;
  pis: string;
  cpf: string;
  cargo: string;
  departamento: string;
  email: string;
  pin: string;
  rfidTag: string;
  fotoUrl: string;
  turno: Turno;
  ativo: boolean;
  biometriaCadastrada: boolean;
}

export interface RegistroPonto {
  id: string;
  nsr: number; // Número Sequencial de Registro
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorPis: string;
  colaboradorCargo: string;
  departamento: string;
  turnoNome: string;
  tipoEvento: TipoEvento;
  timestampUtc: string; // ISO 8601 UTC
  horarioLocal: string; // "DD/MM/YYYY HH:mm:ss"
  dataIso: string; // "YYYY-MM-DD"
  horaIso: string; // "HH:mm"
  fotoCapturadaUrl?: string;
  metodoAutenticacao: MetodoAutenticacao;
  dentroTolerancia: boolean;
  minutosDesvio: number; // minutos de atraso ou adiantamento
  justificativa?: string;
  comprovanteImpresso: boolean;
  comprovanteEmailEnviado: boolean;
  emailDestinatario?: string;
  sincronizadoSupabase: boolean;
  hashIntegridade: string; // SHA-256 HMAC
}

export type TipoInconsistencia = 'atraso_entrada' | 'saida_antecipada' | 'excesso_intervalo' | 'falta_injustificada';
export type StatusInconsistencia = 'pendente' | 'abonado' | 'descontado';

export interface Inconsistencia {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCargo: string;
  data: string; // "YYYY-MM-DD"
  tipo: TipoInconsistencia;
  minutos: number;
  justificativa?: string;
  status: StatusInconsistencia;
  atestadoId?: string;
  criadoEm: string;
}

export type StatusAtestado = 'aprovado' | 'pendente' | 'rejeitado';

export interface Atestado {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  crmMedico: string;
  nomeMedico: string;
  anexoNome: string;
  status: StatusAtestado;
  dataEnvio: string;
  observacoes?: string;
}

export type StatusRede = 'online' | 'offline';
export type StatusImpressora = 'operacional' | 'sem_papel' | 'defeito';

export interface EmpresaConfig {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  localREP: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  conectado: boolean;
}
