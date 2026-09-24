import React, { useState } from 'react';
import { AlertCircle, Clock, Check, FileText } from 'lucide-react';
import { Colaborador, TipoEvento } from '../types';
import { getLabelEvento } from '../services/rules';

interface Props {
  colaborador: Colaborador;
  tipoEvento: TipoEvento;
  motivoTolerancia: string;
  minutosDesvio: number;
  onConfirm: (justificativa: string) => void;
  onCancel: () => void;
}

const MOTIVOS_PREDEFINIDOS = [
  'Atraso no transporte público / trânsito intenso',
  'Consulta ou atendimento médico com atestado a entregar',
  'Problemas operacionais ou técnicos no início da jornada',
  'Atraso autorizado previamente pela coordenação',
  'Compromisso externo de serviço / cliente',
];

export const JustificationModal: React.FC<Props> = ({
  colaborador,
  tipoEvento,
  motivoTolerancia,
  minutosDesvio,
  onConfirm,
  onCancel,
}) => {
  const [justificativa, setJustificativa] = useState('');
  const [motivoSelecionado, setMotivoSelecionado] = useState<string | null>(null);

  const handleSelectMotivo = (motivo: string) => {
    setMotivoSelecionado(motivo);
    setJustificativa(motivo);
  };

  const handleConfirm = () => {
    if (justificativa.trim().length >= 5) {
      onConfirm(justificativa.trim());
    }
  };

  const isValido = justificativa.trim().length >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
        
        {/* Header com Alerta de Tolerância */}
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <span>Justificativa Obrigatória (RF-03)</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
              Marcação Fora da Tolerância
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Colaborador: <strong>{colaborador.nome}</strong> ({getLabelEvento(tipoEvento)})
            </p>
          </div>
        </div>

        {/* Informações da Tolerância e Desvio (RN-01) */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Desvio registrado: {Math.abs(minutosDesvio)} minutos</span>
          </div>
          <p className="text-amber-800">{motivoTolerancia}</p>
          <p className="text-[11px] text-amber-700 italic">
            Conforme o Art. 58 da CLT e a RN-01, variações superiores a 5 minutos exigem justificativa formal no ponto.
          </p>
        </div>

        {/* Seleção Rápida de Motivos Frequentes */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Selecione uma justificativa comum ou digite abaixo:
          </label>
          <div className="space-y-1.5">
            {MOTIVOS_PREDEFINIDOS.map((motivo) => {
              const selecionado = motivoSelecionado === motivo;
              return (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => handleSelectMotivo(motivo)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between cursor-pointer ${
                    selecionado
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{motivo}</span>
                  {selecionado && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo de Texto Personalizado */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Descrição detalhada da justificativa:
          </label>
          <textarea
            rows={3}
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value);
              setMotivoSelecionado(null);
            }}
            placeholder="Digite o motivo detalhado para análise da gestão..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <span className="text-[10px] text-gray-400">Mínimo de 5 caracteres para validação.</span>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Cancelar Marcação
          </button>

          <button
            type="button"
            disabled={!isValido}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition active:scale-95 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Registrar Ponto</span>
          </button>
        </div>

      </div>
    </div>
  );
};
