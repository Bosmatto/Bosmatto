import React from 'react';
import { X, CheckCircle2, ShieldCheck, Cpu, HardDrive, Smartphone } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const SpecModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Documentação Técnica
              </span>
              <span className="text-xs text-gray-400">Portaria 671 MTE / REP-P</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1">
              Especificação e Conformidade do Sistema
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-xs text-gray-700">
          
          {/* Seção 1: Requisitos Funcionais */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Requisitos Funcionais Atendidos (RF-01 a RF-09)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-01: Registro de Ponto</span>
                <p className="text-gray-600 mt-0.5">4 eventos: Entrada, Saída Intervalo, Retorno e Saída Fim com detecção automática do próximo evento.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-02: Emissão de Comprovante</span>
                <p className="text-gray-600 mt-0.5">Ticket físico térmico com Razão Social, CNPJ, Endereço, Nome, PIS, Cargo, Turno e Horário Exato.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-03: Registro de Justificativa</span>
                <p className="text-gray-600 mt-0.5">Modal obrigatório caso a marcação exceda a tolerância legal (CLT art. 58).</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-04: Notificação de Inconsistência</span>
                <p className="text-gray-600 mt-0.5">Alertas automáticos no painel do gestor para atrasos, saídas antecipadas e ausências.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-05: Autenticação Biométrica</span>
                <p className="text-gray-600 mt-0.5">Captura fotográfica nativa via getUserMedia com guia facial e registro no ticket.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-06: Autenticação de Exceção</span>
                <p className="text-gray-600 mt-0.5">Alternativa por Cartão de Proximidade (RFID) ou teclado PIN numérico tátil.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-07: Gestão de Atestados e Abonos</span>
                <p className="text-gray-600 mt-0.5">Upload e cadastro de atestados médicos com CRM, CID e anulação de faltas.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RF-08: Alertas Visuais de Hardware</span>
                <p className="text-gray-600 mt-0.5">Indicadores fixos de rede (Online/Offline) e impressora (Operacional/Sem Papel/Defeito).</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 md:col-span-2">
                <span className="font-bold text-gray-900 block">RF-09: Comprovante Digital (E-mail)</span>
                <p className="text-gray-600 mt-0.5">Contingência automática: envio por e-mail quando a impressora está inoperante ou sem bobina.</p>
              </div>
            </div>
          </div>

          {/* Seção 2: Regras de Negócio */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Regras de Negócio Implementadas (RN-01 a RN-04)</span>
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="font-bold text-blue-900">RN-01: Tolerância de Horário</span>
                <p className="text-blue-800 mt-0.5">Tolerância de 5 minutos por batida e limite máximo de 10 minutos diários acumulados.</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="font-bold text-blue-900">RN-02: Desconto e Horas Excedentes</span>
                <p className="text-blue-800 mt-0.5">Ultrapassada a tolerância diária de 10 minutos, o tempo excedente é computado para desconto.</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="font-bold text-blue-900">RN-03: Imutabilidade do Registro</span>
                <p className="text-blue-800 mt-0.5">Cada batida recebe número sequencial (NSR), carimbo UTC e hash criptográfico SHA-256 inviolável.</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="font-bold text-blue-900">RN-04: Apuração de Faltas</span>
                <p className="text-blue-800 mt-0.5">Ausência total de marcações no encerramento da jornada gera automaticamente Falta Injustificada.</p>
              </div>
            </div>
          </div>

          {/* Seção 3: Requisitos Não-Funcionais */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Requisitos Não-Funcionais (RNF-01 a RNF-03)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RNF-01: Offline-First</span>
                <p className="text-gray-600 mt-0.5">IndexedDB + Service Workers + sincronização automática ao reconectar com Supabase.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RNF-02: Velocidade &lt; 1s</span>
                <p className="text-gray-600 mt-0.5">Gravação local imediata no IndexedDB e emissão com latência subsegundo.</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-900 block">RNF-03: Tablet & Desktop</span>
                <p className="text-gray-600 mt-0.5">Design limpo e ergonômico para telas com largura &gt;= 768px (Clean UI sem emojis).</p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
