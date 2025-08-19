-- Script para criar o banco de dados completo do sistema de telemedicina
-- Execute este script no PostgreSQL do seu VPS

-- 1. Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Criar tabela de usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('paciente', 'medico', 'admin')),
    crm VARCHAR(20),
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true
);

-- Índices para performance da tabela usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_crm ON usuarios(crm) WHERE crm IS NOT NULL;
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Trigger para atualizar campo atualizado_em automaticamente
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE
    ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Criar tabela de consultas
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'finalizada', 'cancelada')),
    especialidade VARCHAR(100) NOT NULL,
    observacoes TEXT,
    link_video VARCHAR(500),
    valor DECIMAL(10,2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance da tabela consultas
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_medico ON consultas(medico_id);
CREATE INDEX idx_consultas_data ON consultas(data_hora);
CREATE INDEX idx_consultas_status ON consultas(status);
CREATE INDEX idx_consultas_data_status ON consultas(data_hora, status);

-- Constraint para evitar conflitos de horário do mesmo médico
CREATE UNIQUE INDEX idx_consultas_medico_horario 
    ON consultas(medico_id, data_hora) 
    WHERE status IN ('agendada', 'em_andamento');

-- 5. Criar tabela de prescrições
CREATE TABLE prescricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    medicamentos JSONB NOT NULL,
    orientacoes TEXT,
    assinatura_digital VARCHAR(500) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativa BOOLEAN DEFAULT true
);

-- Índices para performance da tabela prescricoes
CREATE INDEX idx_prescricoes_consulta ON prescricoes(consulta_id);
CREATE INDEX idx_prescricoes_medico ON prescricoes(medico_id);
CREATE INDEX idx_prescricoes_ativa ON prescricoes(ativa);

-- 6. Criar tabela de pagamentos
CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL CHECK (metodo IN ('cartao', 'pix', 'boleto')),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'estornado')),
    transaction_id VARCHAR(100),
    processado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance da tabela pagamentos
CREATE INDEX idx_pagamentos_consulta ON pagamentos(consulta_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_transaction ON pagamentos(transaction_id);

-- 7. Criar tabela de avaliações
CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance da tabela avaliacoes
CREATE INDEX idx_avaliacoes_medico ON avaliacoes(medico_id);
CREATE INDEX idx_avaliacoes_paciente ON avaliacoes(paciente_id);
CREATE INDEX idx_avaliacoes_nota ON avaliacoes(nota);

-- 8. Criar tabela de histórico médico
CREATE TABLE historico_medico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    diagnostico TEXT,
    tratamento TEXT,
    arquivos_anexos TEXT[], -- Array de caminhos dos arquivos
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance da tabela historico_medico
CREATE INDEX idx_historico_paciente ON historico_medico(paciente_id);
CREATE INDEX idx_historico_consulta ON historico_medico(consulta_id);

-- 9. Inserir dados iniciais
INSERT INTO usuarios (email, senha_hash, nome, tipo) VALUES 
('admin@telemedicina.com', '$2b$10$exemplo_hash_admin', 'Administrador', 'admin');

-- 10. Configurar permissões de usuário da aplicação (execute como superuser)
-- CREATE USER app_telemedicina WITH PASSWORD 'senha_segura';
-- GRANT CONNECT ON DATABASE telemedicina TO app_telemedicina;
-- GRANT USAGE ON SCHEMA public TO app_telemedicina;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_telemedicina;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_telemedicina;