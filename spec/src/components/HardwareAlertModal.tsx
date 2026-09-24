import React from 'react';
import { AlertTriangle, WifiOff, Printer, CheckCircle, X } from 'lucide-react';
import { HardwareAlert } from '../hooks/useHardware';

interface Props {
  alert: HardwareAlert | null;
  onClose: () => void;
  onResolvePrinter?: () => void;
  onToggleNetwork?: () => void;
}

export const HardwareAlertModal: React.FC<Props> = ({
  alert,
  onClose,
  onResolvePrinter,
  onToggleNetwork,
}) => {
  if (!alert) return null;

  const isNetwork = alert.tipo === 'rede_offline';
  const isPrinter = alert.tipo === 'impressora_erro';
  const isSyncSuccess = alert.tipo === 'sincronizacao_sucesso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl flex items-center justify-center ${
                isNetwork
                  ? 'bg-amber-100 text-amber-700'
                  : isPrinter
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isNetwork && <WifiOff className="w-6 h-6" />}
              {isPrinter && <Printer className="w-6 h-6" />}
              {isSyncSuccess && <CheckCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Sistema de Notificação de Hardware
                </span>
                <span className="text-xs text-gray-400">{alert.timestamp}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">{alert.titulo}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 leading-relaxed">
          <p>{alert.mensagem}</p>
        </div>

        {isPrinter && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Contingência Automática Ativada:</strong> Os comprovantes de ponto serão transmitidos imediatamente para o e-mail oficial cadastrado do trabalhador até a substituição da bobina de papel.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          {isPrinter && onResolvePrinter && (
            <button
              onClick={() => {
                onResolvePrinter();
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
            >
              Recarregar Bobina / Normalizar
            </button>
          )}

          {isNetwork && onToggleNetwork && (
            <button
              onClick={() => {
                onToggleNetwork();
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
            >
              Reconectar Conexão
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
