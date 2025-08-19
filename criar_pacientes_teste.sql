-- Inserir pacientes de teste se não existirem
INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cpf) 
SELECT 'Maria Silva', 'maria.silva@email.com', '$2b$10$hash1', 'paciente', '(11) 99999-1111', '123.456.789-01'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'maria.silva@email.com');

INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cpf) 
SELECT 'João Santos', 'joao.santos@email.com', '$2b$10$hash2', 'paciente', '(11) 99999-2222', '987.654.321-02'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'joao.santos@email.com');

INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cpf) 
SELECT 'Ana Costa', 'ana.costa@email.com', '$2b$10$hash3', 'paciente', '(11) 99999-3333', '456.789.123-03'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'ana.costa@email.com');

-- Verificar pacientes criados
SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'paciente';