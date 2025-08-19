-- Criar médico de teste com senha conhecida
INSERT INTO usuarios (email, nome, tipo, senha_hash, crm, especialidade, telefone, cpf, ativo) 
VALUES (
    'dr.teste@hospital.com', 
    'Dr. Teste API', 
    'medico', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    '12345', 
    'Clínica Geral', 
    '11999999999', 
    '12345678901', 
    true
) 
ON CONFLICT (email) DO UPDATE SET 
    senha_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- Verificar se foi criado
SELECT id, email, nome, tipo FROM usuarios WHERE email = 'dr.teste@hospital.com';