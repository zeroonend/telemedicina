// Teste simples da API de autenticação
const testAPI = async () => {
  try {
    console.log('🧪 Testando API de autenticação...');
    
    // Teste de registro
    const registerResponse = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@email.com',
        password: '123456',
        nome: 'Usuario Teste',
        tipo: 'paciente',
        telefone: '11999999999'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('📝 Registro:', registerData);
    
    // Teste de login
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@email.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Login:', loginData);
    
    // Teste de consultas (se login funcionou)
    if (loginData.token) {
      const consultasResponse = await fetch('http://localhost:3002/api/consultas', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      const consultasData = await consultasResponse.json();
      console.log('📅 Consultas:', consultasData);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

testAPI();