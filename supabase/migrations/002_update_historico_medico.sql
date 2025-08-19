-- Migração para atualizar a tabela historico_medico
-- Adiciona campos necessários para o sistema completo de histórico médico

-- Adicionar novos campos à tabela historico_medico
ALTER TABLE historico_medico 
ADD COLUMN IF NOT EXISTS exames TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS medicamentos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para atualizar campo atualizado_em automaticamente
CREATE TRIGGER update_historico_medico_updated_at 
    BEFORE UPDATE ON historico_medico 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_medico_criado_em ON historico_medico(criado_em);
CREATE INDEX IF NOT EXISTS idx_historico_medico_atualizado_em ON historico_medico(atualizado_em);
CREATE INDEX IF NOT EXISTS idx_historico_medico_medicamentos ON historico_medico USING GIN(medicamentos);

-- Comentários para documentação
COMMENT ON COLUMN historico_medico.exames IS 'Resultados de exames e laudos médicos';
COMMENT ON COLUMN historico_medico.observacoes IS 'Observações gerais do médico sobre o paciente';
COMMENT ON COLUMN historico_medico.medicamentos IS 'Lista de medicamentos prescritos em formato JSON';
COMMENT ON COLUMN historico_medico.atualizado_em IS 'Data e hora da última atualização do registro';