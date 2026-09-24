import React, { useState } from 'react';
import {
  AlertTriangle,
  FileCheck,
  Users,
  Calendar,
  Database,
  Printer,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Mail,
  RefreshCw,
  Sliders,
  XCircle,
} from 'lucide-react';
import {
  Atestado,
  Colaborador,
  EmpresaConfig,
  Inconsistencia,
  RegistroPonto,
  StatusImpressora,
  StatusRede,
  SupabaseConfig,
} from '../types';
import { ThermalTicket } from './ThermalTicket';
import { SQL_SCHEMA_SUPABASE, testarConexaoSupabase } from '../services/supabase';
import { getLabelEvento } from '../services/rules';

interface Props {
  colaboradores: Colaborador[];
  registros: RegistroPonto[];
  inconsistencias: Inconsistencia[];
  atestados: Atestado[];
  empresa: EmpresaConfig;
  supabaseConfig: SupabaseConfig;
  networkStatus: StatusRede;
  printerStatus: StatusImpressora;
  onSalvarEmpresaConfig: (config: EmpresaConfig) => Promise<void>;
  onSalvarSupabaseConfig: (config: SupabaseConfig) => Promise<void>;
  onCadastrarAtestado: (atestado: Atestado) => Promise<void>;
  onAtualizarStatusInconsistencia: (id: string, status: 'abonado' | 'descontado', atestadoId?: string) => Promise<void>;
  onExecutarApuracaoFaltas: () => Promise<number>;
  onToggleNetwork: () => void;
  onSetPrinterStatus: (status: StatusImpressora) => void;
}

export const ManagerDashboard: React.FC<Props> = ({
  colaboradores,
  registros,
  inconsistencias,
  atestados,
  empresa,
  supabaseConfig,
  networkStatus,
  printerStatus,
  onSalvarEmpresaConfig,
  onSalvarSupabaseConfig,
  onCadastrarAtestado,
  onAtualizarStatusInconsistencia,
  onExecutarApuracaoFaltas,
  onToggleNetwork,
  onSetPrinterStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'inconsistencias' | 'atestados' | 'registros' | 'colaboradores' | 'configuracoes'>('visao_geral');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [registroSelecionadoTicket, setRegistroSelecionadoTicket] = useState<RegistroPonto | null>(null);

  // Formulário de Atestado Médico (RF-07)
  const [showModalAtestado, setShowModalAtestado] = useState(false);
  const [novoAtestadoColaboradorId, setNovoAtestadoColaboradorId] = useState(colaboradores[0]?.id || '');
  const [novoAtestadoDataInicio, setNovoAtestadoDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [novoAtestadoDataFim, setNovoAtestadoDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [novoAtestadoMotivo, setNovoAtestadoMotivo] = useState('CID J06 - Infecção Aguda das Vias Aéreas Superiores');
  const [novoAtestadoCRM, setNovoAtestadoCRM] = useState('CRM/SP 148.920');
  const [novoAtestadoNomeMedico, setNovoAtestadoNomeMedico] = useState('Dr. Roberto Vasconcelos');
  const [novoAtestadoAnexo, setNovoAtestadoAnexo] = useState('atestado_digitalizado.pdf');

  // Configuração Supabase
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey || '');
  const [sbStatusMsg, setSbStatusMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Configuração da Empresa
  const [empRazao, setEmpRazao] = useState(empresa.razaoSocial);
  const [empCnpj, setEmpCnpj] = useState(empresa.cnpj);
  const [empEndereco, setEmpEndereco] = useState(empresa.endereco);
  const [empCidade, setEmpCidade] = useState(empresa.cidade);
  const [empUf, setEmpUf] = useState(empresa.uf);
  const [empLocalRep, setEmpLocalRep] = useState(empresa.localREP);
  const [savedEmpresaMsg, setSavedEmpresaMsg] = useState(false);

  // Apuração de Faltas Estado
  const [apuracaoMsg, setApuracaoMsg] = useState<string | null>(null);

  const handleSalvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSalvarEmpresaConfig({
      razaoSocial: empRazao,
      cnpj: empCnpj,
      endereco: empEndereco,
      cidade: empCidade,
      uf: empUf,
      localREP: empLocalRep,
    });
    setSavedEmpresaMsg(true);
    setTimeout(() => setSavedEmpresaMsg(false), 3000);
  };

  const handleTestarSupabase = async () => {
    setIsTestingSb(true);
    setSbStatusMsg({ tipo: 'info', texto: 'Verificando conexão com o projeto Supabase...' });
    const res = await testarConexaoSupabase(sbUrl, sbKey);
    if (res.sucesso) {
      setSbStatusMsg({ tipo: 'sucesso', texto: res.mensagem });
      await onSalvarSupabaseConfig({
        url: sbUrl,
        anonKey: sbKey,
        conectado: true,
      });
    } else {
      setSbStatusMsg({ tipo: 'erro', texto: res.mensagem });
    }
    setIsTestingSb(false);
  };

  const handleSubmeterAtestado = async (e: React.FormEvent) => {
    e.preventDefault();
    const colab = colaboradores.find((c) => c.id === novoAtestadoColaboradorId);
    if (!colab) return;

    const novo: Atestado = {
      id: `att-${Date.now()}`,
      colaboradorId: colab.id,
      colaboradorNome: colab.nome,
      dataInicio: novoAtestadoDataInicio,
      dataFim: novoAtestadoDataFim,
      motivo: novoAtestadoMotivo,
      crmMedico: novoAtestadoCRM,
      nomeMedico: novoAtestadoNomeMedico,
      anexoNome: novoAtestadoAnexo,
      status: 'aprovado',
      dataEnvio: new Date().toISOString(),
    };

    await onCadastrarAtestado(novo);

    // Automaticamente abona inconsistências que coincidam com o período
    const inconsistenciasDoColab = inconsistencias.filter(
      (inc) =>
        inc.colaboradorId === colab.id &&
        inc.data >= novoAtestadoDataInicio &&
        inc.data <= novoAtestadoDataFim &&
        inc.status === 'pendente'
    );

    for (const inc of inconsistenciasDoColab) {
      await onAtualizarStatusInconsistencia(inc.id, 'abonado', novo.id);
    }

    setShowModalAtestado(false);
  };

  const handleCopiarSql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SUPABASE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRodarApuracao = async () => {
    const total = await onExecutarApuracaoFaltas();
    setApuracaoMsg(`Apuração concluída: ${total} falta(s) injustificada(s) identificada(s) e registradas.`);
    setTimeout(() => setApuracaoMsg(null), 5000);
  };

  // Métricas para a Visão Geral
  const pendentes = inconsistencias.filter((i) => i.status === 'pendente');
  const registrosHoje = registros.filter((r) => r.dataIso === new Date().toISOString().split('T')[0]);
  const colaboradoresPresentesHoje = new Set(registrosHoje.map((r) => r.colaboradorId)).size;
  const faltasApuradas = inconsistencias.filter((i) => i.tipo === 'falta_injustificada');

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      
      {/* Barra de Navegação do Painel do Gestor */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('visao_geral')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'visao_geral'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('inconsistencias')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'inconsistencias'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Inconsistências (RF-04)</span>
              {pendentes.length > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {pendentes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('atestados')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'atestados'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Atestados & Abonos (RF-07)</span>
            </button>

            <button
              onClick={() => setActiveTab('registros')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'registros'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Espelho de Ponto (RN-03)</span>
            </button>

            <button
              onClick={() => setActiveTab('colaboradores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'colaboradores'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Colaboradores</span>
            </button>

            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Hardware & Supabase</span>
            </button>
          </div>

          {/* Botão de Apuração de Faltas (RN-04) */}
          <button
            onClick={handleRodarApuracao}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition cursor-pointer"
            title="Verifica colaboradores sem marcação ao término do expediente (RN-04)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Apurar Faltas (RN-04)</span>
          </button>

        </div>
      </div>

      {/* Alerta de Feedback da Apuração */}
      {apuracaoMsg && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium flex items-center justify-between">
          <span>{apuracaoMsg}</span>
          <button onClick={() => setApuracaoMsg(null)} className="text-blue-600 hover:text-blue-800">
            Dispensar
          </button>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* Cartões de Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Presentes Hoje</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">
                {colaboradoresPresentesHoje} / {colaboradores.length}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {((colaboradoresPresentesHoje / colaboradores.length) * 100).toFixed(0)}% do quadro em jornada
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total de Batidas Hoje</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">{registrosHoje.length}</p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Registros com carimbo UTC e hash
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Inconsistências Pendentes</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">{pendentes.length}</p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Exigem decisão ou abono do RH
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Faltas Injustificadas</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-2">{faltasApuradas.length}</p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Apuração automática RN-04
              </span>
            </div>

          </div>

          {/* Gráfico / Tabela de Alertas Críticos Recentes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Inconsistências Recentes que Exigem Atenção</h3>
                <p className="text-xs text-gray-500">Alertas automáticos por desvio de tolerância horária (RF-04)</p>
              </div>
              <button
                onClick={() => setActiveTab('inconsistencias')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Ver todas ({inconsistencias.length})
              </button>
            </div>

            {pendentes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Todas as inconsistências estão em dia!</p>
                <p className="text-xs text-gray-400 mt-0.5">Nenhuma marcação pendente de justificativa ou abono no momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Colaborador</th>
                      <th className="p-3">Ocorrência</th>
                      <th className="p-3">Desvio</th>
                      <th className="p-3">Justificativa do Trabalhador</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendentes.slice(0, 5).map((inc) => (
                      <tr key={inc.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-mono font-medium text-gray-700">{inc.data}</td>
                        <td className="p-3 font-bold text-gray-900">{inc.colaboradorNome}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            inc.tipo === 'atraso_entrada'
                              ? 'bg-amber-100 text-amber-800'
                              : inc.tipo === 'saida_antecipada'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-red-100 text-red-900'
                          }`}>
                            {inc.tipo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-gray-900">{inc.minutos} min</td>
                        <td className="p-3 text-gray-600 italic max-w-xs truncate">
                          {inc.justificativa || 'Sem justificativa informada'}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => onAtualizarStatusInconsistencia(inc.id, 'abonado')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Abonar
                          </button>
                          <button
                            onClick={() => onAtualizarStatusInconsistencia(inc.id, 'descontado')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
                          >
                            Descontar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INCONSISTÊNCIAS E NOTIFICAÇÕES (RF-04, RN-01, RN-02) */}
      {activeTab === 'inconsistencias' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Gestão de Inconsistências de Ponto (RF-04)</h3>
              <p className="text-xs text-gray-500">
                Atrasos, saídas antecipadas, quebras de tolerância e ausências apuradas (RN-01, RN-02, RN-04).
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar por colaborador..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Tipo de Inconsistência</th>
                  <th className="p-3">Tempo / Desvio</th>
                  <th className="p-3">Justificativa Registrada</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Decisão do Gestor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inconsistencias
                  .filter((i) => i.colaboradorNome.toLowerCase().includes(filtroTexto.toLowerCase()))
                  .map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50/80">
                      <td className="p-3 font-mono text-gray-700">{inc.data}</td>
                      <td className="p-3 font-bold text-gray-900">{inc.colaboradorNome}</td>
                      <td className="p-3 text-gray-500">{inc.colaboradorCargo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          inc.tipo === 'atraso_entrada'
                            ? 'bg-amber-100 text-amber-800'
                            : inc.tipo === 'saida_antecipada'
                            ? 'bg-rose-100 text-rose-800'
                            : inc.tipo === 'falta_injustificada'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-orange-100 text-orange-900'
                        }`}>
                          {inc.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        {inc.tipo === 'falta_injustificada' ? 'Dia Integral' : `${inc.minutos} min`}
                      </td>
                      <td className="p-3 text-gray-700 italic max-w-xs">
                        {inc.justificativa || 'Sem justificativa apresentada'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          inc.status === 'abonado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inc.status === 'descontado'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {inc.status === 'pendente' ? (
                          <>
                            <button
                              onClick={() => onAtualizarStatusInconsistencia(inc.id, 'abonado')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Abonar
                            </button>
                            <button
                              onClick={() => onAtualizarStatusInconsistencia(inc.id, 'descontado')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
                            >
                              Descontar (RN-02)
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GESTÃO DE ATESTADOS E ABONOS (RF-07) */}
      {activeTab === 'atestados' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Gestão de Atestados Médicos e Abonos (RF-07)</h3>
              <p className="text-xs text-gray-500">
                Cadastro e arquivo de atestados médicos para abono legal de faltas e justificativas.
              </p>
            </div>

            <button
              onClick={() => setShowModalAtestado(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Atestado</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">Data de Envio</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Período de Afastamento</th>
                  <th className="p-3">Diagnóstico / CID</th>
                  <th className="p-3">Médico / CRM</th>
                  <th className="p-3">Comprovante</th>
                  <th className="p-3 text-right">Status do Abono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atestados.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50/80">
                    <td className="p-3 font-mono text-gray-600">
                      {new Date(att.dataEnvio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{att.colaboradorNome}</td>
                    <td className="p-3 font-medium text-gray-700">
                      {att.dataInicio} até {att.dataFim}
                    </td>
                    <td className="p-3 text-gray-800 font-medium">{att.motivo}</td>
                    <td className="p-3 text-gray-600">
                      {att.nomeMedico} ({att.crmMedico})
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-blue-600 font-mono text-[11px]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{att.anexoNome}</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Abonado pelo RH
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ESPELHO DE PONTO & REGISTROS IMUTÁVEIS (RN-03, RF-02, RF-09) */}
      {activeTab === 'registros' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Espelho de Ponto Eletrônico e Auditoria (RN-03)</h3>
              <p className="text-xs text-gray-500">
                Registros imutáveis com número sequencial (NSR), carimbo UTC e hash de integridade SHA-256.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Filtrar por nome ou PIS..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">NSR</th>
                  <th className="p-3">Data & Hora</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">PIS</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Autenticação</th>
                  <th className="p-3">Tolerância</th>
                  <th className="p-3">Comprovante</th>
                  <th className="p-3">Supabase</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros
                  .filter(
                    (r) =>
                      r.colaboradorNome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                      r.colaboradorPis.includes(filtroTexto)
                  )
                  .map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50/80">
                      <td className="p-3 font-mono font-bold text-gray-900">#{reg.nsr}</td>
                      <td className="p-3 font-mono text-gray-700">{reg.horarioLocal}</td>
                      <td className="p-3 font-bold text-gray-900">{reg.colaboradorNome}</td>
                      <td className="p-3 font-mono text-gray-500">{reg.colaboradorPis}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-blue-50 text-blue-800">
                          {getLabelEvento(reg.tipoEvento)}
                        </span>
                      </td>
                      <td className="p-3 capitalize text-gray-600">
                        {reg.metodoAutenticacao.replace('_', ' ')}
                      </td>
                      <td className="p-3">
                        {reg.dentroTolerancia ? (
                          <span className="text-emerald-700 font-semibold text-[11px]">Regular</span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[11px]">
                            Desvio {reg.minutosDesvio}m
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {reg.comprovanteImpresso ? (
                          <span className="flex items-center gap-1 text-emerald-700 text-[11px]">
                            <Printer className="w-3.5 h-3.5" />
                            <span>Impresso</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-700 text-[11px]">
                            <Mail className="w-3.5 h-3.5" />
                            <span>E-mail</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {reg.sincronizadoSupabase ? (
                          <span className="text-emerald-600 font-semibold text-[10px]">Sincronizado</span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[10px]">Pendente Offline</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setRegistroSelecionadoTicket(reg)}
                          className="px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 text-[11px] font-semibold hover:bg-gray-100 transition cursor-pointer"
                        >
                          Ver Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: COLABORADORES */}
      {activeTab === 'colaboradores' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Quadro de Colaboradores Cadastrados</h3>
              <p className="text-xs text-gray-500">Gestão de jornadas contratuais, credenciais PIN e tags RFID.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colaboradores.map((colab) => (
              <div
                key={colab.id}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 transition flex items-start gap-4"
              >
                <img
                  src={colab.fotoUrl}
                  alt={colab.nome}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{colab.nome}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Ativo
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{colab.cargo} • {colab.departamento}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">PIS: {colab.pis} | CPF: {colab.cpf}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{colab.email}</p>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Credencial PIN:</span>
                      <span className="font-mono font-bold text-gray-800">{colab.pin}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Tag RFID (Exceção):</span>
                      <span className="font-mono font-bold text-blue-700">{colab.rfidTag}</span>
                    </div>
                  </div>

                  <div className="mt-2 p-2 rounded-lg bg-white border border-gray-200 text-[10px] text-gray-600 flex justify-between">
                    <span>{colab.turno.nome}:</span>
                    <span className="font-mono font-bold">
                      {colab.turno.entrada} - {colab.turno.saidaIntervalo} / {colab.turno.retornoIntervalo} - {colab.turno.saidaFim}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CONFIGURAÇÕES, HARDWARE E SUPABASE */}
      {activeTab === 'configuracoes' && (
        <div className="space-y-6">
          
          {/* Painel de Controle de Simulação de Hardware (RF-08, RF-09) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Simulador de Periféricos & Hardware (RF-08, RF-09)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Use estes controles para testar os cenários de desconexão de rede e contingência de impressora.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Controle de Rede */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Conectividade de Rede (RNF-01)</span>
                  <span className="text-[11px] text-gray-500">
                    Status atual: <strong className="uppercase">{networkStatus}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleNetwork}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    networkStatus === 'online'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {networkStatus === 'online' ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>Simular Queda de Rede</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>Restabelecer Rede</span>
                    </>
                  )}
                </button>
              </div>

              {/* Controle de Impressora */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Status da Impressora Térmica (RF-08, RF-09)</span>
                  <span className="text-[11px] text-gray-500">
                    Status: <strong className="uppercase">{printerStatus.replace('_', ' ')}</strong>
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetPrinterStatus('operacional')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      printerStatus === 'operacional'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Operacional
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPrinterStatus('sem_papel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      printerStatus === 'sem_papel'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sem Papel
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Dados Cadastrais da Empresa Emissora (RF-02) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Dados da Empresa Empregadora (RF-02)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Informações legais impressas em todos os comprovantes térmicos e digitais.
            </p>

            <form onSubmit={handleSalvarEmpresa} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Razão Social:</label>
                <input
                  type="text"
                  value={empRazao}
                  onChange={(e) => setEmpRazao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">CNPJ:</label>
                <input
                  type="text"
                  value={empCnpj}
                  onChange={(e) => setEmpCnpj(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Endereço Completo:</label>
                <input
                  type="text"
                  value={empEndereco}
                  onChange={(e) => setEmpEndereco(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Cidade / UF:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={empCidade}
                    onChange={(e) => setEmpCidade(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                  <input
                    type="text"
                    value={empUf}
                    onChange={(e) => setEmpUf(e.target.value)}
                    className="w-20 px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Local / Identificador REP:</label>
                <input
                  type="text"
                  value={empLocalRep}
                  onChange={(e) => setEmpLocalRep(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between pt-2">
                {savedEmpresaMsg && (
                  <span className="text-xs font-semibold text-emerald-600">
                    Dados da empresa atualizados com sucesso!
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition cursor-pointer shadow-sm"
                >
                  Salvar Dados da Empresa
                </button>
              </div>
            </form>
          </div>

          {/* Integração com Banco de Dados Supabase (PostgreSQL) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Conexão Supabase REST API (PostgreSQL)</h3>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                supabaseConfig.conectado
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {supabaseConfig.conectado ? 'Supabase Conectado' : 'Modo Local IndexedDB Ativo'}
              </span>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              O sistema opera com arquitetura <strong>Offline-First (RNF-01)</strong>. Você pode conectar seu projeto Supabase para sincronização em nuvem contínua.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Supabase Project URL:</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Supabase Anon Key:</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {sbStatusMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                sbStatusMsg.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : sbStatusMsg.tipo === 'erro'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {sbStatusMsg.texto}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopiarSql}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL do Banco'}</span>
              </button>

              <button
                type="button"
                disabled={isTestingSb || !sbUrl || !sbKey}
                onClick={handleTestarSupabase}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingSb ? 'animate-spin' : ''}`} />
                <span>Testar e Salvar Conexão</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal para Cadastro de Atestado Médico (RF-07) */}
      {showModalAtestado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
              Cadastrar Atestado Médico para Abono (RF-07)
            </h3>

            <form onSubmit={handleSubmeterAtestado} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Colaborador:</label>
                <select
                  value={novoAtestadoColaboradorId}
                  onChange={(e) => setNovoAtestadoColaboradorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Data Início:</label>
                  <input
                    type="date"
                    value={novoAtestadoDataInicio}
                    onChange={(e) => setNovoAtestadoDataInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Data Fim:</label>
                  <input
                    type="date"
                    value={novoAtestadoDataFim}
                    onChange={(e) => setNovoAtestadoDataFim(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Diagnóstico / Motivo / CID:</label>
                <input
                  type="text"
                  value={novoAtestadoMotivo}
                  onChange={(e) => setNovoAtestadoMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nome do Médico:</label>
                  <input
                    type="text"
                    value={novoAtestadoNomeMedico}
                    onChange={(e) => setNovoAtestadoNomeMedico(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">CRM do Médico:</label>
                  <input
                    type="text"
                    value={novoAtestadoCRM}
                    onChange={(e) => setNovoAtestadoCRM(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nome do Anexo / Comprovante:</label>
                <input
                  type="text"
                  value={novoAtestadoAnexo}
                  onChange={(e) => setNovoAtestadoAnexo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModalAtestado(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Confirmar e Abonar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizador do Ticket Físico (RF-02) */}
      {registroSelecionadoTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 text-center">
              Comprovante Legal Impresso (Portaria 671 MTE)
            </h3>
            <ThermalTicket
              registro={registroSelecionadoTicket}
              empresa={empresa}
              onClose={() => setRegistroSelecionadoTicket(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
