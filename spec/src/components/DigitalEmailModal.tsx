import React from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, Printer, AlertTriangle, X } from 'lucide-react';
import { EmpresaConfig, RegistroPonto } from '../types';
import { getLabelEvento } from '../services/rules';

interface Props {
  registro: RegistroPonto;
  empresa: EmpresaConfig;
  onClose: () => void;
}

export const DigitalEmailModal: React.FC<Props> = ({ registro, empresa, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Comprovante Digital Transmitido (RF-09)</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">Envio Automático por E-mail</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Motivo do Acionamento da Contingência */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Protocolo de Contingência de Impressão Ativado:</p>
            <p className="mt-0.5 text-amber-800">
              A impressora do terminal está sem papel ou inoperante. Em conformidade com o <strong>RF-09</strong>, o comprovante legal foi enviado imediatamente para o e-mail do colaborador.
            </p>
          </div>
        </div>

        {/* Prévia do E-mail Transmitido */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden text-xs">
          <div className="p-3 bg-gray-100/80 border-b border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Destinatário:</span>
              <span className="font-bold text-gray-900">{registro.emailDestinatario || 'colaborador@pontotech.com.br'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Assunto:</span>
              <span className="text-gray-800 font-medium">Comprovante Eletrônico de Registro de Ponto #{registro.nsr}</span>
            </div>
          </div>

          <div className="p-4 space-y-2 bg-white">
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">Colaborador:</span>
              <span className="font-semibold text-gray-800">{registro.colaboradorNome}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">Evento Registrado:</span>
              <span className="font-bold text-blue-700 uppercase">{getLabelEvento(registro.tipoEvento)}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">Horário Gravado:</span>
              <span className="font-bold text-gray-900 text-sm">{registro.horarioLocal}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-500">PIS / PESP:</span>
              <span className="font-mono text-gray-700">{registro.colaboradorPis}</span>
            </div>
            <div className="pt-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Hash Criptográfico de Auditoria (RN-03):</span>
              <span className="font-mono text-[9px] text-gray-600 break-all bg-gray-50 p-1.5 rounded block border border-gray-200 mt-1">
                {registro.hashIntegridade}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition active:scale-95 cursor-pointer shadow-sm"
          >
            Confirmar e Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
