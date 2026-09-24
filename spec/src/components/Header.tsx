import React, { useEffect, useState } from 'react';
import {
  Wifi,
  WifiOff,
  Printer,
  Clock,
  LayoutDashboard,
  Tablet,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StatusImpressora, StatusRede } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  currentView: 'kiosk' | 'gestor';
  onViewChange: (view: 'kiosk' | 'gestor') => void;
  networkStatus: StatusRede;
  printerStatus: StatusImpressora;
  onToggleNetwork: () => void;
  onCyclePrinterState: () => void;
  inconsistenciasPendentesCount: number;
  onOpenHelp: () => void;
}

export const Header: React.FC<Props> = ({
  currentView,
  onViewChange,
  networkStatus,
  printerStatus,
  onToggleNetwork,
  onCyclePrinterState,
  inconsistenciasPendentesCount,
  onOpenHelp,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHora = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatData = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOnline = networkStatus === 'online';
  const isPrinterOk = printerStatus === 'operacional';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Identidade do Sistema */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">PontoTech</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  REP-P PWA
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Controle de Ponto Eletrônico Portaria 671 MTE</p>
            </div>
          </div>

          {/* Relógio Digital de Alta Precisão (Tablet/Desktop) */}
          <div className="hidden md:flex flex-col items-center justify-center px-4 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-900 font-mono text-2xl font-extrabold tracking-tight">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>{formatHora(currentTime)}</span>
            </div>
            <span className="text-[11px] font-medium text-gray-500 capitalize">
              {formatData(currentTime)}
            </span>
          </div>

          {/* Indicadores Fixos de Hardware & Alternador de Módulo */}
          <div className="flex items-center gap-3">
            {/* Indicador Fixo Visual de Rede */}
            <button
              onClick={onToggleNetwork}
              title={`Clique para simular alternância de rede (Atualmente: ${networkStatus.toUpperCase()})`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span>Rede Online</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  <span>Rede Offline</span>
                </>
              )}
            </button>

            {/* Indicador Fixo Visual de Impressora */}
            <button
              onClick={onCyclePrinterState}
              title={`Clique para simular status da impressora (Atualmente: ${printerStatus.toUpperCase()})`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                isPrinterOk
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {isPrinterOk ? (
                <>
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span className="hidden lg:inline">Impressora Operacional</span>
                  <span className="lg:hidden">Impressora OK</span>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  <Printer className="w-4 h-4 text-rose-600" />
                  <span className="font-bold">
                    {printerStatus === 'sem_papel' ? 'Sem Papel' : 'Defeito Impressora'}
                  </span>
                </>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Botão de Ajuda / Especificação do Sistema */}
            <button
              onClick={onOpenHelp}
              title="Especificações e Manual de Operação"
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Divisor */}
            <div className="h-6 w-px bg-gray-200" />

            {/* Alternador de Visão: Kiosk vs Gestor */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                onClick={() => onViewChange('kiosk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentView === 'kiosk'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span>Terminal Kiosk</span>
              </button>

              <button
                onClick={() => onViewChange('gestor')}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentView === 'gestor'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel do Gestor</span>
                {inconsistenciasPendentesCount > 0 && (
                  <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {inconsistenciasPendentesCount}
                  </span>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
