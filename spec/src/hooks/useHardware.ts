import { useEffect, useState } from 'react';
import { StatusImpressora, StatusRede } from '../types';
import { sincronizarRegistrosPendentes } from '../services/supabase';

export interface HardwareAlert {
  id: string;
  tipo: 'rede_offline' | 'impressora_erro' | 'sincronizacao_sucesso';
  titulo: string;
  mensagem: string;
  timestamp: string;
}

export function useHardware() {
  const [networkStatus, setNetworkStatus] = useState<StatusRede>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  const [printerStatus, setPrinterStatus] = useState<StatusImpressora>('operacional');
  const [activeAlert, setActiveAlert] = useState<HardwareAlert | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = async () => {
      if (!isSimulatedOffline) {
        setNetworkStatus('online');
        // Ao voltar online, dispara auto-sync conforme RNF-01
        try {
          const res = await sincronizarRegistrosPendentes();
          if (res.totalSincronizados > 0) {
            setActiveAlert({
              id: Date.now().toString(),
              tipo: 'sincronizacao_sucesso',
              titulo: 'Conexão Restaurada',
              mensagem: `${res.totalSincronizados} registro(s) offline foram sincronizados com sucesso com o banco de dados.`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
          }
        } catch (e) {
          console.error('Erro na sincronização pós-conexão:', e);
        }
      }
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      setActiveAlert({
        id: Date.now().toString(),
        tipo: 'rede_offline',
        titulo: 'Alerta de Hardware: Desconexão de Rede (RF-08)',
        mensagem: 'O terminal está operando em Modo Offline (RNF-01). Todas as marcações serão salvas com segurança no IndexedDB e sincronizadas assim que a conexão for restabelecida.',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  const toggleSimulatedNetwork = async () => {
    if (networkStatus === 'online') {
      setIsSimulatedOffline(true);
      setNetworkStatus('offline');
      setActiveAlert({
        id: Date.now().toString(),
        tipo: 'rede_offline',
        titulo: 'Alerta de Hardware: Desconexão de Rede (RF-08)',
        mensagem: 'O terminal está operando em Modo Offline (RNF-01). Todas as marcações serão salvas com segurança no IndexedDB e sincronizadas assim que a conexão for restabelecida.',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    } else {
      setIsSimulatedOffline(false);
      setNetworkStatus('online');
      const res = await sincronizarRegistrosPendentes();
      setActiveAlert({
        id: Date.now().toString(),
        tipo: 'sincronizacao_sucesso',
        titulo: 'Rede Restabelecida - Sincronização Ativa',
        mensagem: res.totalSincronizados > 0
          ? `${res.totalSincronizados} registro(s) offline foram sincronizados com o Supabase com sucesso.`
          : 'Terminal reconectado à nuvem. Dados em conformidade.',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    }
  };

  const setPrinterState = (status: StatusImpressora) => {
    setPrinterStatus(status);
    if (status !== 'operacional') {
      setActiveAlert({
        id: Date.now().toString(),
        tipo: 'impressora_erro',
        titulo: status === 'sem_papel' ? 'Alerta de Hardware: Impressora Sem Papel' : 'Alerta de Hardware: Falha na Impressora',
        mensagem: status === 'sem_papel'
          ? 'A bobina térmica acabou. Conforme RF-09, os comprovantes de ponto serão transmitidos digitalmente para o e-mail cadastrado dos colaboradores.'
          : 'A impressora apresentou uma falha mecânica/de comunicação. Acionado o protocolo de contingência com envio digital por e-mail (RF-09).',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    }
  };

  const closeAlert = () => setActiveAlert(null);

  return {
    networkStatus,
    printerStatus,
    activeAlert,
    isSimulatedOffline,
    toggleSimulatedNetwork,
    setPrinterState,
    closeAlert,
  };
}
