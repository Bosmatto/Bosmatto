-- =========================================================================
-- SISTEMA DE CONTROLE DE PONTO ELETRÔNICO PWA (PONTOTECH)
-- Banco de Dados: Supabase (PostgreSQL)
-- Conformidade: Portaria 671/2021 MTE / REP-P / CLT Art. 58
-- =========================================================================

-- 1. TABELA DE EMPRESA CONFIGURAÇÃO (RF-02)
CREATE TABLE IF NOT EXISTS empresa_config (
    id TEXT PRIMARY KEY DEFAULT 'config_principal',
    razao_social TEXT NOT NULL DEFAULT 'PontoTech Soluções de Tecnologia Ltda',
    cnpj TEXT NOT NULL DEFAULT '34.892.109/0001-44',
    endereco TEXT NOT NULL DEFAULT 'Avenida Paulista, 1578, 14º Andar - Bela Vista',
    cidade TEXT NOT NULL DEFAULT 'São Paulo',
    uf TEXT NOT NULL DEFAULT 'SP',
    local_rep TEXT NOT NULL DEFAULT 'Terminal Tablet Recepção Principal - T01',
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Inserção de dados padrão da empresa
INSERT INTO empresa_config (id, razao_social, cnpj, endereco, cidade, uf, local_rep)
VALUES (
    'config_principal',
    'PontoTech Soluções de Tecnologia Ltda',
    '34.892.109/0001-44',
    'Avenida Paulista, 1578, 14º Andar - Bela Vista',
    'São Paulo',
    'SP',
    'Terminal Tablet Recepção Principal - T01'
)
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE COLABORADORES & ESCALAS DE TURNO (RF-05, RF-06)
CREATE TABLE IF NOT EXISTS colaboradores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    pis TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    email TEXT NOT NULL,
    pin TEXT NOT NULL,
    rfid_tag TEXT,
    foto_url TEXT,
    turno JSONB NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    biometria_cadastrada BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida no terminal Kiosk
CREATE INDEX IF NOT EXISTS idx_colaboradores_pis ON colaboradores (pis);
CREATE INDEX IF NOT EXISTS idx_colaboradores_pin ON colaboradores (pin);
CREATE INDEX IF NOT EXISTS idx_colaboradores_rfid ON colaboradores (rfid_tag);

-- 3. TABELA DE REGISTROS DE PONTO (RF-01, RF-02, RN-03 IMUTABILIDADE)
-- Esta tabela armazena cada batida de ponto com carimbo UTC e hash inviolável SHA-256
CREATE TABLE IF NOT EXISTS registros_ponto (
    id TEXT PRIMARY KEY,
    nsr BIGINT UNIQUE NOT NULL,
    colaborador_id TEXT REFERENCES colaboradores(id) ON DELETE RESTRICT,
    colaborador_nome TEXT NOT NULL,
    colaborador_pis TEXT NOT NULL,
    colaborador_cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    turno_nome TEXT NOT NULL,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('entrada', 'saida_intervalo', 'retorno_intervalo', 'saida_fim')),
    timestamp_utc TIMESTAMPTZ NOT NULL,
    horario_local TEXT NOT NULL,
    data_iso DATE NOT NULL,
    hora_iso TEXT NOT NULL,
    foto_capturada_url TEXT,
    metodo_autenticacao TEXT NOT NULL CHECK (metodo_autenticacao IN ('biometria_facial', 'rfid', 'pin')),
    dentro_tolerancia BOOLEAN NOT NULL DEFAULT TRUE,
    minutos_desvio INTEGER DEFAULT 0,
    justificativa TEXT,
    comprovante_impresso BOOLEAN DEFAULT FALSE,
    comprovante_email_enviado BOOLEAN DEFAULT FALSE,
    email_destinatario TEXT,
    hash_integridade TEXT NOT NULL,
    sincronizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para espelho de ponto e relatórios fiscais
CREATE INDEX IF NOT EXISTS idx_registros_colab_data ON registros_ponto (colaborador_id, data_iso);
CREATE INDEX IF NOT EXISTS idx_registros_nsr ON registros_ponto (nsr);
CREATE INDEX IF NOT EXISTS idx_registros_data_iso ON registros_ponto (data_iso);

-- 4. TABELA DE INCONSISTÊNCIAS E ALERTAS PARA O GESTOR (RF-03, RF-04, RN-01, RN-02, RN-04)
CREATE TABLE IF NOT EXISTS inconsistencias (
    id TEXT PRIMARY KEY,
    colaborador_id TEXT REFERENCES colaboradores(id) ON DELETE RESTRICT,
    colaborador_nome TEXT NOT NULL,
    colaborador_cargo TEXT NOT NULL,
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('atraso_entrada', 'saida_antecipada', 'excesso_intervalo', 'falta_injustificada')),
    minutos INTEGER NOT NULL,
    justificativa TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'abonado', 'descontado')),
    atestado_id TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inconsistencias_colab ON inconsistencias (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_status ON inconsistencias (status);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_data ON inconsistencias (data);

-- 5. TABELA DE GESTÃO DE ATESTADOS MÉDICOS E ABONOS (RF-07)
CREATE TABLE IF NOT EXISTS atestados_medicos (
    id TEXT PRIMARY KEY,
    colaborador_id TEXT REFERENCES colaboradores(id) ON DELETE RESTRICT,
    colaborador_nome TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    motivo TEXT NOT NULL,
    crm_medico TEXT NOT NULL,
    nome_medico TEXT NOT NULL,
    anexo_nome TEXT,
    status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('aprovado', 'pendente', 'rejeitado')),
    data_envio TIMESTAMPTZ DEFAULT NOW(),
    observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_atestados_colab ON atestados_medicos (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_atestados_periodo ON atestados_medicos (data_inicio, data_fim);

-- =========================================================================
-- CARGA INICIAL DE COLABORADORES PADRÃO (SEMENTE / SEED)
-- =========================================================================
INSERT INTO colaboradores (id, nome, pis, cpf, cargo, departamento, email, pin, rfid_tag, foto_url, turno, ativo, biometria_cadastrada)
VALUES
(
    'colab-1',
    'Carlos Eduardo Oliveira',
    '128.45678.90-1',
    '123.456.789-00',
    'Operador de Sistemas',
    'Tecnologia da Informação',
    'carlos.oliveira@pontotech.com.br',
    '1234',
    'RFID-98421',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    '{"nome": "Comercial Matutino", "entrada": "08:00", "saidaIntervalo": "12:00", "retornoIntervalo": "13:00", "saidaFim": "17:00"}'::jsonb,
    TRUE,
    TRUE
),
(
    'colab-2',
    'Mariana Silveira Santos',
    '174.98123.45-6',
    '234.567.890-11',
    'Analista de Recursos Humanos',
    'Recursos Humanos',
    'mariana.santos@pontotech.com.br',
    '4321',
    'RFID-45892',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    '{"nome": "Administrativo Flex", "entrada": "08:30", "saidaIntervalo": "12:30", "retornoIntervalo": "13:30", "saidaFim": "17:30"}'::jsonb,
    TRUE,
    TRUE
),
(
    'colab-3',
    'Rodrigo Mendonça Costa',
    '192.34567.89-0',
    '345.678.901-22',
    'Supervisor Operacional',
    'Operações',
    'rodrigo.costa@pontotech.com.br',
    '5678',
    'RFID-77123',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    '{"nome": "Turno A", "entrada": "07:00", "saidaIntervalo": "11:00", "retornoIntervalo": "12:00", "saidaFim": "16:00"}'::jsonb,
    TRUE,
    TRUE
),
(
    'colab-4',
    'Juliana Beatriz Carvalho',
    '165.78901.23-4',
    '456.789.012-33',
    'Assistente Administrativo',
    'Administração',
    'juliana.carvalho@pontotech.com.br',
    '9012',
    'RFID-88390',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    '{"nome": "Comercial Matutino", "entrada": "08:00", "saidaIntervalo": "12:00", "retornoIntervalo": "13:00", "saidaFim": "17:00"}'::jsonb,
    TRUE,
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    pis = EXCLUDED.pis,
    cpf = EXCLUDED.cpf,
    cargo = EXCLUDED.cargo,
    departamento = EXCLUDED.departamento,
    email = EXCLUDED.email,
    pin = EXCLUDED.pin,
    rfid_tag = EXCLUDED.rfid_tag,
    foto_url = EXCLUDED.foto_url,
    turno = EXCLUDED.turno,
    atualizado_em = NOW();

-- =========================================================================
-- POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- Permite leitura e sincronização via chave anon do Supabase
-- =========================================================================

ALTER TABLE empresa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE inconsistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE atestados_medicos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para a chave anon (REST API do app PWA)
CREATE POLICY "Permitir leitura da configuração da empresa para anon"
    ON empresa_config FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir leitura e escrita de colaboradores para anon"
    ON colaboradores FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura e inserção de registros de ponto para anon"
    ON registros_ponto FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura e atualização de inconsistências para anon"
    ON inconsistencias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura e envio de atestados para anon"
    ON atestados_medicos FOR ALL TO anon USING (true) WITH CHECK (true);

-- =========================================================================
-- REGRA DE IMUTABILIDADE FISCAL (RN-03)
-- Impede alteração ou exclusão física de registros de ponto
-- =========================================================================
CREATE OR REPLACE FUNCTION proteger_imutabilidade_registro_ponto()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Conforme a Portaria 671 MTE e a regra RN-03, os registros de ponto são estritamente imutáveis.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Conforme a Portaria 671 MTE e a regra RN-03, é proibido excluir registros de ponto.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_registros_ponto ON registros_ponto;
CREATE TRIGGER trg_proteger_registros_ponto
BEFORE UPDATE OR DELETE ON registros_ponto
FOR EACH ROW EXECUTE FUNCTION proteger_imutabilidade_registro_ponto();
