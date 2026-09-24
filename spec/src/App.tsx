import React, { useEffect, useState, useCallback } from 'react';
import {
  Atestado,
  Colaborador,
  EmpresaConfig,
  Inconsistencia,
  RegistroPonto,
  StatusImpressora,
  SupabaseConfig,
} from './types';
import { dbService, EMPRESA_CONFIG_PADRAO } from './services/db';
import { Header } from './components/Header';
import { KioskTerminal } from './components/KioskTerminal';
import { ManagerDashboard } from './components/ManagerDashboard';
import { HardwareAlertModal } from './components/HardwareAlertModal';
import { SpecModal } from './components/SpecModal';
import { useHardware } from './hooks/useHardware';
import { sincronizarRegistrosPendentes } from './services/supabase';
import { horarioParaMinutos } from './services/rules';
import { Monitor, Tablet, Info } from 'lucide-react';

export default function App() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [inconsistencias, setInconsistencias] = useState<Inconsistencia[]>([]);
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaConfig>(EMPRESA_CONFIG_PADRAO);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    conectado: false,
  });

  const [currentView, setCurrentView] = useState<'kiosk' | 'gestor'>('kiosk');
  const [showSpecModal, setShowSpecModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Hook de Hardware (Rede, Impressora e Alertas RF-08)
  const {
    networkStatus,
    printerStatus,
    activeAlert,
    toggleSimulatedNetwork,
    setPrinterState,
    closeAlert,
  } = useHardware();

  // Carrega dados do IndexedDB na montagem
  const carregarDadosLocais = useCallback(async () => {
    try {
      const [colabs, regs, incs, atts, emp, sb] = await Promise.all([
        dbService.getColaboradores(),
        dbService.getRegistros(),
        dbService.getInconsistencias(),
        dbService.getAtestados(),
        dbService.getEmpresaConfig(),
        dbService.getSupabaseConfig(),
      ]);

      setColaboradores(colabs);
      setRegistros(regs);
      setInconsistencias(incs);
      setAtestados(atts);
      setEmpresa(emp);
      setSupabaseConfig(sb);
    } catch (err) {
      console.error('Erro ao carregar dados do IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosLocais();
  }, [carregarDadosLocais]);

  // Ciclo de estados da impressora para fácil simulação
  const handleCyclePrinterState = () => {
    if (printerStatus === 'operacional') {
      setPrinterState('sem_papel');
    } else if (printerStatus === 'sem_papel') {
      setPrinterState('defeito');
    } else {
      setPrinterState('operacional');
    }
  };

  // Registra novo ponto (RNF-02, RN-03)
  const handleRegistrarPonto = async (novoRegistro: RegistroPonto) => {
    await dbService.salvarRegistro(novoRegistro);
    // Atualiza estado local
    setRegistros((prev) => [novoRegistro, ...prev]);

    // Se estiver online, tenta sincronização imediata em segundo plano
    if (networkStatus === 'online') {
      sincronizarRegistrosPendentes().catch((err) => {
        console.warn('Sincronização em background adiada:', err);
      });
    }
  };

  // Gera alerta automático de inconsistência no banco para o gestor (RF-04)
  const handleGerarInconsistencia = async (registro: RegistroPonto) => {
    let tipo: Inconsistencia['tipo'] = 'atraso_entrada';

    if (registro.tipoEvento === 'saida_fim') {
      tipo = 'saida_antecipada';
    } else if (registro.tipoEvento === 'retorno_intervalo') {
      tipo = 'excesso_intervalo';
    }

    const novaInconsistencia: Inconsistencia = {
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      colaboradorId: registro.colaboradorId,
      colaboradorNome: registro.colaboradorNome,
      colaboradorCargo: registro.colaboradorCargo,
      data: registro.dataIso,
      tipo,
      minutos: Math.abs(registro.minutosDesvio),
      justificativa: registro.justificativa,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    };

    await dbService.salvarInconsistencia(novaInconsistencia);
    setInconsistencias((prev) => [novaInconsistencia, ...prev]);
  };

  // Obtém os registros do dia atual para um colaborador
  const handleGetRegistrosHoje = async (colaboradorId: string): Promise<RegistroPonto[]> => {
    const hoje = new Date().toISOString().split('T')[0];
    return registros.filter((r) => r.colaboradorId === colaboradorId && r.dataIso === hoje);
  };

  // Cadastra Atestado Médico (RF-07)
  const handleCadastrarAtestado = async (novoAtestado: Atestado) => {
    await dbService.salvarAtestado(novoAtestado);
    setAtestados((prev) => [novoAtestado, ...prev]);
  };

  // Atualiza status de inconsistência (Abonar ou Descontar)
  const handleAtualizarStatusInconsistencia = async (
    id: string,
    status: 'abonado' | 'descontado',
    atestadoId?: string
  ) => {
    await dbService.atualizarStatusInconsistencia(id, status, atestadoId);
    setInconsistencias((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status, atestadoId: atestadoId || inc.atestadoId } : inc))
    );
  };

  // RN-04: Apuração de Faltas
  // Ausência total de marcações ao final do expediente é registrada automaticamente como Falta Injustificada
  const handleExecutarApuracaoFaltas = async (): Promise<number> => {
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

    let faltasCriadas = 0;

    for (const colab of colaboradores) {
      if (!colab.ativo) continue;

      // Verifica se o colaborador já possui qualquer registro hoje
      const temRegistrosHoje = registros.some((r) => r.colaboradorId === colab.id && r.dataIso === hoje);

      // Verifica se já foi gerada falta hoje
      const jaPossuiFaltaRegistrada = inconsistencias.some(
        (i) => i.colaboradorId === colab.id && i.data === hoje && i.tipo === 'falta_injustificada'
      );

      // Horário previsto do fim da jornada deste colaborador
      const minSaidaPrevista = horarioParaMinutos(colab.turno.saidaFim);

      // Se a jornada já terminou (ou em apuração forçada) e não bateu ponto:
      if (!temRegistrosHoje && !jaPossuiFaltaRegistrada) {
        // Gera Falta Injustificada automática
        const falta: Inconsistencia = {
          id: `falta-${Date.now()}-${colab.id}`,
          colaboradorId: colab.id,
          colaboradorNome: colab.nome,
          colaboradorCargo: colab.cargo,
          data: hoje,
          tipo: 'falta_injustificada',
          minutos: 480, // jornada padrão de 8h
          justificativa: 'Sem registro de batidas ao término do expediente (RN-04).',
          status: 'pendente',
          criadoEm: new Date().toISOString(),
        };

        await dbService.salvarInconsistencia(falta);
        setInconsistencias((prev) => [falta, ...prev]);
        faltasCriadas++;
      }
    }

    return faltasCriadas;
  };

  // Salva configuração da empresa
  const handleSalvarEmpresaConfig = async (novaConfig: EmpresaConfig) => {
    await dbService.salvarEmpresaConfig(novaConfig);
    setEmpresa(novaConfig);
  };

  // Salva configuração Supabase
  const handleSalvarSupabaseConfig = async (novaConfig: SupabaseConfig) => {
    await dbService.salvarSupabaseConfig(novaConfig);
    setSupabaseConfig(novaConfig);
  };

  const inconsistenciasPendentes = inconsistencias.filter((i) => i.status === 'pendente').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-800">Inicializando Sistema PontoTech PWA...</h2>
        <p className="text-xs text-gray-500 mt-1">Carregando banco local IndexedDB e periféricos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col text-gray-900">
      
      {/* Banner Informativo de Resolução caso tela < 768px */}
      <div className="md:hidden bg-amber-500 text-white text-[11px] font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 print:hidden">
        <Tablet className="w-4 h-4 shrink-0" />
        <span>Sistema otimizado para Tablets e Desktops (min-width: 768px).</span>
      </div>

      {/* Header Fixo com Indicadores de Hardware (Rede e Impressora) */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        networkStatus={networkStatus}
        printerStatus={printerStatus}
        onToggleNetwork={toggleSimulatedNetwork}
        onCyclePrinterState={handleCyclePrinterState}
        inconsistenciasPendentesCount={inconsistenciasPendentes}
        onOpenHelp={() => setShowSpecModal(true)}
      />

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 flex flex-col">
        {currentView === 'kiosk' ? (
          <KioskTerminal
            colaboradores={colaboradores}
            empresa={empresa}
            printerStatus={printerStatus}
            networkStatus={networkStatus}
            onRegistrarPonto={handleRegistrarPonto}
            onGerarInconsistencia={handleGerarInconsistencia}
            getRegistrosHojeDoColaborador={handleGetRegistrosHoje}
          />
        ) : (
          <ManagerDashboard
            colaboradores={colaboradores}
            registros={registros}
            inconsistencias={inconsistencias}
            atestados={atestados}
            empresa={empresa}
            supabaseConfig={supabaseConfig}
            networkStatus={networkStatus}
            printerStatus={printerStatus}
            onSalvarEmpresaConfig={handleSalvarEmpresaConfig}
            onSalvarSupabaseConfig={handleSalvarSupabaseConfig}
            onCadastrarAtestado={handleCadastrarAtestado}
            onAtualizarStatusInconsistencia={handleAtualizarStatusInconsistencia}
            onExecutarApuracaoFaltas={handleExecutarApuracaoFaltas}
            onToggleNetwork={toggleSimulatedNetwork}
            onSetPrinterStatus={setPrinterState}
          />
        )}
      </main>

      {/* Rodapé do Sistema */}
      <footer className="w-full bg-white border-t border-gray-200 py-3 px-4 text-center text-xs text-gray-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">PontoTech PWA</span>
            <span>•</span>
            <span>Portaria 671/2021 MTE (REP-P)</span>
            <span>•</span>
            <span className="text-[11px] text-gray-400 font-mono">v1.0.0</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-700 font-medium">IndexedDB Offline-First Ativo</span>
            <button
              onClick={() => setShowSpecModal(true)}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Especificação Técnica &amp; RFs
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Alerta Visual de Hardware (RF-08) */}
      <HardwareAlertModal
        alert={activeAlert}
        onClose={closeAlert}
        onResolvePrinter={() => setPrinterState('operacional')}
        onToggleNetwork={toggleSimulatedNetwork}
      />

      {/* Modal de Documentação e Especificação Técnica */}
      {showSpecModal && <SpecModal onClose={() => setShowSpecModal(false)} />}

    </div>
  );
}
