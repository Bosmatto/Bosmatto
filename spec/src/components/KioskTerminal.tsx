import React, { useState, useEffect } from 'react';
import {
  Camera,
  CreditCard,
  KeyRound,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Printer,
  Mail,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  Colaborador,
  EmpresaConfig,
  MetodoAutenticacao,
  RegistroPonto,
  StatusImpressora,
  StatusRede,
  TipoEvento,
} from '../types';
import { CameraCapture } from './CameraCapture';
import { NumericPinPad } from './NumericPinPad';
import { RfidScanner } from './RfidScanner';
import { ThermalTicket } from './ThermalTicket';
import { DigitalEmailModal } from './DigitalEmailModal';
import { JustificationModal } from './JustificationModal';
import {
  determinarProximoEvento,
  gerarHashIntegridade,
  getLabelEvento,
  verificarToleranciaMarcação,
} from '../services/rules';

interface Props {
  colaboradores: Colaborador[];
  empresa: EmpresaConfig;
  printerStatus: StatusImpressora;
  networkStatus: StatusRede;
  onRegistrarPonto: (registro: RegistroPonto) => Promise<void>;
  onGerarInconsistencia: (registro: RegistroPonto) => Promise<void>;
  getRegistrosHojeDoColaborador: (colaboradorId: string) => Promise<RegistroPonto[]>;
}

export const KioskTerminal: React.FC<Props> = ({
  colaboradores,
  empresa,
  printerStatus,
  networkStatus,
  onRegistrarPonto,
  onGerarInconsistencia,
  getRegistrosHojeDoColaborador,
}) => {
  // Modo de Autenticação ativo
  const [authMethod, setAuthMethod] = useState<MetodoAutenticacao>('biometria_facial');
  const [colaboradorAtivo, setColaboradorAtivo] = useState<Colaborador | null>(null);
  const [colaboradoresRegistrosHoje, setColaboradoresRegistrosHoje] = useState<RegistroPonto[]>([]);
  const [tipoEventoSelecionado, setTipoEventoSelecionado] = useState<TipoEvento>('entrada');
  
  // Estados de Entrada de Credenciais
  const [pinValue, setPinValue] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modais de Fluxo
  const [pendingJustification, setPendingJustification] = useState<{
    motivo: string;
    desvio: number;
    colaborador: Colaborador;
    evento: TipoEvento;
  } | null>(null);

  const [ultimoRegistroConcluido, setUltimoRegistroConcluido] = useState<RegistroPonto | null>(null);
  const [showDigitalEmailModal, setShowDigitalEmailModal] = useState<boolean>(false);

  // Carrega registros de hoje quando seleciona colaborador
  useEffect(() => {
    if (colaboradorAtivo) {
      getRegistrosHojeDoColaborador(colaboradorAtivo.id).then((regs) => {
        setColaboradoresRegistrosHoje(regs);
        const proximo = determinarProximoEvento(regs);
        setTipoEventoSelecionado(proximo);
      });
    }
  }, [colaboradorAtivo, getRegistrosHojeDoColaborador]);

  // Handler de Seleção Rápida de Colaborador (para Biometria)
  const handleSelecionarColaboradorBiometria = (colab: Colaborador) => {
    setColaboradorAtivo(colab);
  };

  // Handler de Submissão do PIN (RF-06)
  const handlePinSubmit = () => {
    setPinError(null);
    const encontrado = colaboradores.find((c) => c.pin === pinValue && c.ativo);
    if (encontrado) {
      setColaboradorAtivo(encontrado);
      setPinValue('');
    } else {
      setPinError('PIN não reconhecido ou colaborador inativo.');
    }
  };

  // Handler de Leitura RFID (RF-06)
  const handleRfidScan = (rfidTag: string) => {
    const encontrado = colaboradores.find((c) => c.rfidTag === rfidTag && c.ativo);
    if (encontrado) {
      setColaboradorAtivo(encontrado);
    } else {
      alert('Tag RFID não encontrada nos registros autorizados.');
    }
  };

  // Handler de Iniciar Marcação de Ponto (RNF-02 < 1s)
  const handleIniciarMarcacao = async () => {
    if (!colaboradorAtivo) return;

    const agora = new Date();
    const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Verifica regras de tolerância (RN-01)
    const checkTolerancia = verificarToleranciaMarcação(
      colaboradorAtivo,
      tipoEventoSelecionado,
      horaAtual,
      colaboradoresRegistrosHoje
    );

    // Se ultrapassou tolerância, solicita justificativa obrigatória (RF-03)
    if (checkTolerancia.exigeJustificativa) {
      setPendingJustification({
        motivo: checkTolerancia.motivoTolerancia,
        desvio: checkTolerancia.minutosDesvio,
        colaborador: colaboradorAtivo,
        evento: tipoEventoSelecionado,
      });
      return;
    }

    // Se dentro da tolerância, grava imediatamente
    await executarGravacaoRegistro(colaboradorAtivo, tipoEventoSelecionado, checkTolerancia.dentroTolerancia, checkTolerancia.minutosDesvio);
  };

  // Handler de Confirmação com Justificativa (RF-03)
  const handleConfirmarComJustificativa = async (justificativaTexto: string) => {
    if (!pendingJustification) return;
    const { colaborador, evento, desvio } = pendingJustification;
    setPendingJustification(null);
    await executarGravacaoRegistro(colaborador, evento, false, desvio, justificativaTexto);
  };

  // Gravação Central Imutável (RN-03, RF-02, RF-08, RF-09)
  const executarGravacaoRegistro = async (
    colaborador: Colaborador,
    tipoEvento: TipoEvento,
    dentroTolerancia: boolean,
    minutosDesvio: number,
    justificativa?: string
  ) => {
    setIsProcessing(true);
    const startTimestamp = performance.now();

    const agora = new Date();
    const timestampUtc = agora.toISOString();
    const dataIso = agora.toISOString().split('T')[0];
    const horaIso = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const horarioLocal = `${agora.toLocaleDateString('pt-BR')} ${horaIso}`;
    const nsrSimulado = Date.now() % 1000000;

    // Gera Hash SHA-256 de Imutabilidade (RN-03)
    const hash = await gerarHashIntegridade(nsrSimulado, colaborador.pis, timestampUtc, tipoEvento);

    // Avalia estado da impressora para emissão física (RF-02) ou digital (RF-09)
    const isPrinterOk = printerStatus === 'operacional';
    const comprovanteImpresso = isPrinterOk;
    const comprovanteEmailEnviado = !isPrinterOk;

    const novoRegistro: RegistroPonto = {
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nsr: nsrSimulado,
      colaboradorId: colaborador.id,
      colaboradorNome: colaborador.nome,
      colaboradorPis: colaborador.pis,
      colaboradorCargo: colaborador.cargo,
      departamento: colaborador.departamento,
      turnoNome: colaborador.turno.nome,
      tipoEvento,
      timestampUtc,
      horarioLocal,
      dataIso,
      horaIso,
      fotoCapturadaUrl: fotoCapturada || undefined,
      metodoAutenticacao: authMethod,
      dentroTolerancia,
      minutosDesvio,
      justificativa,
      comprovanteImpresso,
      comprovanteEmailEnviado,
      emailDestinatario: colaborador.email,
      sincronizadoSupabase: networkStatus === 'online',
      hashIntegridade: hash,
    };

    // Salva no banco de dados local IndexedDB
    await onRegistrarPonto(novoRegistro);

    // Se houve desvio ou tolerância rompida, gera alerta automático para o gestor (RF-04)
    if (!dentroTolerancia || minutosDesvio > 5) {
      await onGerarInconsistencia(novoRegistro);
    }

    const elapsedMs = performance.now() - startTimestamp;
    console.log(`[PontoTech RNF-02] Tempo de gravação e resposta: ${elapsedMs.toFixed(1)}ms`);

    setIsProcessing(false);
    setUltimoRegistroConcluido(novoRegistro);

    // Se impressora estava sem papel ou com defeito, abre modal do comprovante digital por e-mail (RF-09)
    if (!isPrinterOk) {
      setShowDigitalEmailModal(true);
    }
  };

  const handleResetKiosk = () => {
    setColaboradorAtivo(null);
    setFotoCapturada(null);
    setUltimoRegistroConcluido(null);
    setShowDigitalEmailModal(false);
    setPinValue('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Container Principal Kiosk */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Caso a marcação tenha sido realizada com sucesso */}
        {ultimoRegistroConcluido ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              Registro Concluído com Sucesso
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Ponto Marcado: {getLabelEvento(ultimoRegistroConcluido.tipoEvento)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Colaborador: <strong>{ultimoRegistroConcluido.colaboradorNome}</strong> às {ultimoRegistroConcluido.horaIso}
            </p>

            {/* Status da Emissão de Comprovante */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {ultimoRegistroConcluido.comprovanteImpresso ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Ticket Físico Emitido na Impressora (RF-02)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Comprovante Digital Enviado p/ {ultimoRegistroConcluido.emailDestinatario} (RF-09)</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-mono border border-gray-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>NSR #{ultimoRegistroConcluido.nsr} (Imutável)</span>
              </div>
            </div>

            {/* Exibição do Comprovante Físico Prévia */}
            <div className="mt-8 w-full flex justify-center">
              <ThermalTicket
                registro={ultimoRegistroConcluido}
                empresa={empresa}
                onClose={handleResetKiosk}
              />
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleResetKiosk}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition active:scale-95 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Finalizar e Retornar ao Terminal</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            
            {/* Lado Esquerdo: Métodos de Autenticação e Câmera */}
            <div className="lg:col-span-6 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Identificação do Trabalhador</h2>
                    <p className="text-xs text-gray-500">Selecione o método de autenticação biométrica ou credencial</p>
                  </div>
                </div>

                {/* Abas de Seleção de Autenticação (RF-05, RF-06) */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-200/70 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('biometria_facial');
                      setPinError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      authMethod === 'biometria_facial'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Biometria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('pin');
                      setPinError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      authMethod === 'pin'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>PIN (Exceção)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('rfid');
                      setPinError(null);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      authMethod === 'rfid'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>RFID (Cartão)</span>
                  </button>
                </div>

                {/* Conteúdo da Autenticação Conforme Método Selecionado */}
                {authMethod === 'biometria_facial' && (
                  <div>
                    {/* Lista rápida de colaboradores para reconhecimento facial rápido */}
                    {!colaboradorAtivo && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Selecione o seu perfil para validação facial:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {colaboradores.filter((c) => c.ativo).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelecionarColaboradorBiometria(c)}
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-xs text-left transition active:scale-95 cursor-pointer"
                            >
                              <img
                                src={c.fotoUrl}
                                alt={c.nome}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-gray-900 truncate">{c.nome}</p>
                                <p className="text-[10px] text-gray-500 truncate">{c.cargo}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Captura de Foto Câmera Nativa (RF-05) */}
                    <div className="mt-2">
                      <CameraCapture
                        onCapture={(foto) => setFotoCapturada(foto)}
                        isCapturing={isProcessing}
                      />
                    </div>
                  </div>
                )}

                {authMethod === 'pin' && (
                  <div className="py-2">
                    <p className="text-xs text-gray-600 text-center mb-1">
                      Digite o seu PIN numérico de 4 dígitos no teclado virtual:
                    </p>
                    {pinError && (
                      <div className="mb-2 p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium text-center border border-rose-200">
                        {pinError}
                      </div>
                    )}
                    <NumericPinPad
                      value={pinValue}
                      onChange={setPinValue}
                      onSubmit={handlePinSubmit}
                      maxLength={4}
                      disabled={isProcessing}
                    />
                  </div>
                )}

                {authMethod === 'rfid' && (
                  <div className="py-2">
                    <RfidScanner
                      colaboradores={colaboradores}
                      onScanRfid={handleRfidScan}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>

              {/* Informação Legal de Proteção de Dados e Portaria 671 */}
              <div className="mt-4 pt-3 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
                <span>REP-P Portaria 671 MTE</span>
                <span>Auditado e Criptografado</span>
              </div>
            </div>

            {/* Lado Direito: Confirmação do Colaborador e Eventos */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Dados da Marcação</h3>
                    <p className="text-xs text-gray-500">Selecione o evento para registrar o carimbo</p>
                  </div>

                  {colaboradorAtivo && (
                    <button
                      type="button"
                      onClick={() => setColaboradorAtivo(null)}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      Trocar Colaborador
                    </button>
                  )}
                </div>

                {colaboradorAtivo ? (
                  <div className="space-y-5 animate-in fade-in">
                    
                    {/* Cartão do Colaborador Reconhecido */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                      <img
                        src={colaboradorAtivo.fotoUrl}
                        alt={colaboradorAtivo.nome}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {colaboradorAtivo.nome}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Ativo
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{colaboradorAtivo.cargo} • {colaboradorAtivo.departamento}</p>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">PIS: {colaboradorAtivo.pis}</p>
                      </div>
                    </div>

                    {/* Escala e Horários do Turno */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800">Jornada Contratual:</span>
                        <span className="font-semibold text-blue-700">{colaboradorAtivo.turno.nome}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                          <span className="text-gray-400 block text-[9px]">Entrada</span>
                          <span className="font-bold text-gray-800">{colaboradorAtivo.turno.entrada}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                          <span className="text-gray-400 block text-[9px]">Intervalo</span>
                          <span className="font-bold text-gray-800">{colaboradorAtivo.turno.saidaIntervalo}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                          <span className="text-gray-400 block text-[9px]">Retorno</span>
                          <span className="font-bold text-gray-800">{colaboradorAtivo.turno.retornoIntervalo}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                          <span className="text-gray-400 block text-[9px]">Saída</span>
                          <span className="font-bold text-gray-800">{colaboradorAtivo.turno.saidaFim}</span>
                        </div>
                      </div>
                    </div>

                    {/* Seleção do Tipo de Evento (RF-01) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2">
                        Selecione o Evento de Ponto (RF-01):
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['entrada', 'saida_intervalo', 'retorno_intervalo', 'saida_fim'] as TipoEvento[]).map((tipo) => {
                          const selecionado = tipoEventoSelecionado === tipo;
                          const proximoRecomendado = determinarProximoEvento(colaboradoresRegistrosHoje) === tipo;
                          const jaMarcadoHoje = colaboradoresRegistrosHoje.some((r) => r.tipoEvento === tipo);

                          return (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => setTipoEventoSelecionado(tipo)}
                              className={`relative p-3 rounded-xl border text-left transition active:scale-95 cursor-pointer flex flex-col justify-between ${
                                selecionado
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${selecionado ? 'text-white' : 'text-gray-900'}`}>
                                  {getLabelEvento(tipo)}
                                </span>
                                {jaMarcadoHoje && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    selecionado ? 'bg-blue-700 text-blue-100' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    Registrado
                                  </span>
                                )}
                              </div>
                              {proximoRecomendado && (
                                <span className={`text-[10px] font-semibold mt-2 inline-flex items-center gap-1 ${
                                  selecionado ? 'text-blue-100' : 'text-blue-600'
                                }`}>
                                  <Sparkles className="w-3 h-3" />
                                  <span>Próximo Previsto</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Histórico do dia deste colaborador */}
                    {colaboradoresRegistrosHoje.length > 0 && (
                      <div className="text-xs">
                        <span className="font-semibold text-gray-500 block mb-1">
                          Marcações Realizadas Hoje ({colaboradoresRegistrosHoje.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {colaboradoresRegistrosHoje.map((reg) => (
                            <span
                              key={reg.id}
                              className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-mono border border-gray-200"
                            >
                              {getLabelEvento(reg.tipoEvento)}: <strong>{reg.horaIso}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                    <User className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">Aguardando Identificação</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Alinhe seu rosto à câmera, use seu PIN no teclado tátil ou aproxime seu crachá RFID.
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Gravação de Ponto (< 1s RNF-02) */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  disabled={!colaboradorAtivo || isProcessing}
                  onClick={handleIniciarMarcacao}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-base hover:bg-blue-700 active:scale-98 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Clock className="w-5 h-5" />
                  <span>
                    {isProcessing ? 'Registrando Ponto...' : 'REGISTRAR PONTO AGORA'}
                  </span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Gravação auditada com carimbo UTC instantâneo (RNF-02 &lt; 1s)
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Modal de Justificativa Obrigatória (RF-03) */}
      {pendingJustification && (
        <JustificationModal
          colaborador={pendingJustification.colaborador}
          tipoEvento={pendingJustification.evento}
          motivoTolerancia={pendingJustification.motivo}
          minutosDesvio={pendingJustification.desvio}
          onConfirm={handleConfirmarComJustificativa}
          onCancel={() => setPendingJustification(null)}
        />
      )}

      {/* Modal de Envio Digital de Comprovante por E-mail (RF-09) */}
      {showDigitalEmailModal && ultimoRegistroConcluido && (
        <DigitalEmailModal
          registro={ultimoRegistroConcluido}
          empresa={empresa}
          onClose={() => setShowDigitalEmailModal(false)}
        />
      )}
    </div>
  );
};
