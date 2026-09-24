import { Atestado, Colaborador, EmpresaConfig, Inconsistencia, RegistroPonto, SupabaseConfig } from '../types';

const DB_NAME = 'pontotech_db';
const DB_VERSION = 2;

// Colaboradores padrão para inicialização do sistema Kiosk
export const COLABORADORES_PADRAO: Colaborador[] = [
  {
    id: 'colab-1',
    nome: 'Carlos Eduardo Oliveira',
    pis: '128.45678.90-1',
    cpf: '123.456.789-00',
    cargo: 'Operador de Sistemas',
    departamento: 'Tecnologia da Informação',
    email: 'carlos.oliveira@pontotech.com.br',
    pin: '1234',
    rfidTag: 'RFID-98421',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    turno: {
      nome: 'Comercial Matutino',
      entrada: '08:00',
      saidaIntervalo: '12:00',
      retornoIntervalo: '13:00',
      saidaFim: '17:00',
    },
    ativo: true,
    biometriaCadastrada: true,
  },
  {
    id: 'colab-2',
    nome: 'Mariana Silveira Santos',
    pis: '174.98123.45-6',
    cpf: '234.567.890-11',
    cargo: 'Analista de Recursos Humanos',
    departamento: 'Recursos Humanos',
    email: 'mariana.santos@pontotech.com.br',
    pin: '4321',
    rfidTag: 'RFID-45892',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    turno: {
      nome: 'Administrativo Flex',
      entrada: '08:30',
      saidaIntervalo: '12:30',
      retornoIntervalo: '13:30',
      saidaFim: '17:30',
    },
    ativo: true,
    biometriaCadastrada: true,
  },
  {
    id: 'colab-3',
    nome: 'Rodrigo Mendonça Costa',
    pis: '192.34567.89-0',
    cpf: '345.678.901-22',
    cargo: 'Supervisor Operacional',
    departamento: 'Operações',
    email: 'rodrigo.costa@pontotech.com.br',
    pin: '5678',
    rfidTag: 'RFID-77123',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    turno: {
      nome: 'Turno A',
      entrada: '07:00',
      saidaIntervalo: '11:00',
      retornoIntervalo: '12:00',
      saidaFim: '16:00',
    },
    ativo: true,
    biometriaCadastrada: true,
  },
  {
    id: 'colab-4',
    nome: 'Juliana Beatriz Carvalho',
    pis: '165.78901.23-4',
    cpf: '456.789.012-33',
    cargo: 'Assistente Administrativo',
    departamento: 'Administração',
    email: 'juliana.carvalho@pontotech.com.br',
    pin: '9012',
    rfidTag: 'RFID-88390',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    turno: {
      nome: 'Comercial Matutino',
      entrada: '08:00',
      saidaIntervalo: '12:00',
      retornoIntervalo: '13:00',
      saidaFim: '17:00',
    },
    ativo: true,
    biometriaCadastrada: true,
  },
];

export const EMPRESA_CONFIG_PADRAO: EmpresaConfig = {
  razaoSocial: 'PontoTech Soluções de Tecnologia Ltda',
  cnpj: '34.892.109/0001-44',
  endereco: 'Avenida Paulista, 1578, 14º Andar - Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  localREP: 'Terminal Tablet Recepção Principal - T01',
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB não suportado'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('colaboradores')) {
          const store = db.createObjectStore('colaboradores', { keyPath: 'id' });
          store.createIndex('pis', 'pis', { unique: true });
          store.createIndex('pin', 'pin', { unique: false });
          store.createIndex('rfidTag', 'rfidTag', { unique: false });
        }

        if (!db.objectStoreNames.contains('registros')) {
          const store = db.createObjectStore('registros', { keyPath: 'id' });
          store.createIndex('colaboradorId', 'colaboradorId', { unique: false });
          store.createIndex('dataIso', 'dataIso', { unique: false });
          store.createIndex('sincronizadoSupabase', 'sincronizadoSupabase', { unique: false });
          store.createIndex('nsr', 'nsr', { unique: true });
        }

        if (!db.objectStoreNames.contains('inconsistencias')) {
          const store = db.createObjectStore('inconsistencias', { keyPath: 'id' });
          store.createIndex('colaboradorId', 'colaboradorId', { unique: false });
          store.createIndex('data', 'data', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('atestados')) {
          const store = db.createObjectStore('atestados', { keyPath: 'id' });
          store.createIndex('colaboradorId', 'colaboradorId', { unique: false });
        }

        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'chave' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        await this.popularDadosIniciais(db);
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async popularDadosIniciais(db: IDBDatabase): Promise<void> {
    const tx = db.transaction(['colaboradores', 'config'], 'readwrite');
    const colabStore = tx.objectStore('colaboradores');
    const configStore = tx.objectStore('config');

    // Verifica se já possui colaboradores
    const countReq = colabStore.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        for (const colab of COLABORADORES_PADRAO) {
          colabStore.put(colab);
        }
      }
    };

    // Salva configuração padrão da empresa
    configStore.put({ chave: 'empresa', valor: EMPRESA_CONFIG_PADRAO });
    configStore.put({
      chave: 'supabase',
      valor: {
        url: '',
        anonKey: '',
        conectado: false,
      } as SupabaseConfig,
    });
  }

  // --- Colaboradores ---
  async getColaboradores(): Promise<Colaborador[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readonly');
      const store = tx.objectStore('colaboradores');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getColaboradorPorId(id: string): Promise<Colaborador | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readonly');
      const store = tx.objectStore('colaboradores');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getColaboradorPorPin(pin: string): Promise<Colaborador | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readonly');
      const store = tx.objectStore('colaboradores');
      const index = store.index('pin');
      const req = index.get(pin);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getColaboradorPorRfid(rfidTag: string): Promise<Colaborador | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readonly');
      const store = tx.objectStore('colaboradores');
      const index = store.index('rfidTag');
      const req = index.get(rfidTag);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async salvarColaborador(colaborador: Colaborador): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readwrite');
      const store = tx.objectStore('colaboradores');
      const req = store.put(colaborador);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Registros de Ponto (RN-03 Imutabilidade) ---
  async getRegistros(): Promise<RegistroPonto[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('registros', 'readonly');
      const store = tx.objectStore('registros');
      const req = store.getAll();
      req.onsuccess = () => {
        const registros: RegistroPonto[] = req.result || [];
        // Ordena por NSR decrescente (mais recentes primeiro)
        registros.sort((a, b) => b.nsr - a.nsr);
        resolve(registros);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getRegistrosPorColaboradorEData(colaboradorId: string, dataIso: string): Promise<RegistroPonto[]> {
    const todos = await this.getRegistros();
    return todos.filter(r => r.colaboradorId === colaboradorId && r.dataIso === dataIso);
  }

  async getProximoNSR(): Promise<number> {
    const registros = await this.getRegistros();
    if (registros.length === 0) return 1001;
    const maxNsr = Math.max(...registros.map(r => r.nsr || 0));
    return maxNsr + 1;
  }

  async salvarRegistro(registro: RegistroPonto): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('registros', 'readwrite');
      const store = tx.objectStore('registros');
      const req = store.add(registro); // 'add' garante imutabilidade para novas chaves
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async marcarRegistroSincronizado(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('registros', 'readwrite');
      const store = tx.objectStore('registros');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, sincronizadoSupabase: true };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async getRegistrosNaoSincronizados(): Promise<RegistroPonto[]> {
    const todos = await this.getRegistros();
    return todos.filter(r => !r.sincronizadoSupabase);
  }

  // --- Inconsistências (RF-04) ---
  async getInconsistencias(): Promise<Inconsistencia[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inconsistencias', 'readonly');
      const store = tx.objectStore('inconsistencias');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: Inconsistencia[] = req.result || [];
        list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async salvarInconsistencia(inconsistencia: Inconsistencia): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inconsistencias', 'readwrite');
      const store = tx.objectStore('inconsistencias');
      const req = store.put(inconsistencia);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async atualizarStatusInconsistencia(id: string, status: 'abonado' | 'descontado', atestadoId?: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inconsistencias', 'readwrite');
      const store = tx.objectStore('inconsistencias');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated: Inconsistencia = {
            ...getReq.result,
            status,
            atestadoId: atestadoId || getReq.result.atestadoId,
          };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- Atestados Médicos (RF-07) ---
  async getAtestados(): Promise<Atestado[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('atestados', 'readonly');
      const store = tx.objectStore('atestados');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: Atestado[] = req.result || [];
        list.sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async salvarAtestado(atestado: Atestado): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('atestados', 'readwrite');
      const store = tx.objectStore('atestados');
      const req = store.put(atestado);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Configurações da Empresa e Supabase ---
  async getEmpresaConfig(): Promise<EmpresaConfig> {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const req = store.get('empresa');
      req.onsuccess = () => resolve(req.result?.valor || EMPRESA_CONFIG_PADRAO);
      req.onerror = () => resolve(EMPRESA_CONFIG_PADRAO);
    });
  }

  async salvarEmpresaConfig(config: EmpresaConfig): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readwrite');
      const store = tx.objectStore('config');
      const req = store.put({ chave: 'empresa', valor: config });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getSupabaseConfig(): Promise<SupabaseConfig> {
    const db = await this.dbPromise;
    return new Promise((resolve) => {
      const tx = db.transaction('config', 'readonly');
      const store = tx.objectStore('config');
      const req = store.get('supabase');
      req.onsuccess = () => resolve(req.result?.valor || { url: '', anonKey: '', conectado: false });
      req.onerror = () => resolve({ url: '', anonKey: '', conectado: false });
    });
  }

  async salvarSupabaseConfig(config: SupabaseConfig): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readwrite');
      const store = tx.objectStore('config');
      const req = store.put({ chave: 'supabase', valor: config });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new IndexedDBStorage();
