import React, { useState } from 'react';
import { CreditCard, Radio, Check, Sparkles } from 'lucide-react';
import { Colaborador } from '../types';

interface Props {
  colaboradores: Colaborador[];
  onScanRfid: (rfidTag: string) => void;
  disabled?: boolean;
}

export const RfidScanner: React.FC<Props> = ({ colaboradores, onScanRfid, disabled = false }) => {
  const [manualTag, setManualTag] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateTap = (rfidTag: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onScanRfid(rfidTag);
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTag.trim()) {
      onScanRfid(manualTag.trim());
      setManualTag('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Sensor de Proximidade Virtual */}
      <div className="relative w-full p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-slate-700 flex flex-col items-center text-center shadow-lg">
        <div className="relative mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isScanning ? 'bg-emerald-500/20 text-emerald-400 scale-110' : 'bg-blue-500/10 text-blue-400'
          }`}>
            <Radio className={`w-10 h-10 ${isScanning ? 'animate-ping' : 'animate-pulse'}`} />
          </div>
          <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping opacity-30" />
        </div>

        <h4 className="text-white font-bold text-base">Aproxime o Crachá RFID</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Posicione a tag de proximidade ou crachá inteligente em frente ao leitor do terminal.
        </p>

        {/* Simulação Rápida de Crachás Cadastrados */}
        <div className="mt-6 w-full pt-4 border-t border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Simulador de Crachás Autorizados:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {colaboradores.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={disabled || isScanning}
                onClick={() => handleSimulateTap(c.rfidTag)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-blue-400 hover:bg-slate-700/80 text-left transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{c.nome.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{c.rfidTag}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leitor Manual de Código de Barras / RFID */}
      <form onSubmit={handleManualSubmit} className="mt-4 w-full flex items-center gap-2">
        <input
          type="text"
          value={manualTag}
          onChange={(e) => setManualTag(e.target.value)}
          placeholder="Ou digite o código da Tag RFID..."
          disabled={disabled}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <button
          type="submit"
          disabled={disabled || !manualTag.trim()}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition active:scale-95 cursor-pointer disabled:opacity-40"
        >
          Validar
        </button>
      </form>
    </div>
  );
};
