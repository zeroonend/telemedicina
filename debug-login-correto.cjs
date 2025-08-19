const http = require('http');

console.log('=== DEBUG LOGIN CORRETO ===');

const postData = JSON.stringify({
  email: 'medico@teste.com',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta completa:', data);
    
    try {
      const response = JSON.parse(data);
      console.log('Resposta parseada:', JSON.stringify(response, null, 2));
      
      if (response.token) {
        console.log('✅ Token encontrado:', response.token);
        
        // Testar a API de pacientes com este token
        testarPacientes(response.token);
      } else {
        console.log('❌ Token não encontrado. Chaves disponíveis:', Object.keys(response));
      }
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao conectar:', error.message);
  console.log('💡 Verifique se o servidor está rodando em http://localhost:3002');
});

req.write(postData);
req.end();

function testarPacientes(token) {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/usuarios?tipo=paciente',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('\n=== TESTANDO API DE PACIENTES ===');
      console.log('Status:', res.statusCode);
      console.log('Resposta:', data);
      
      if (res.statusCode === 200) {
        try {
          const pacientes = JSON.parse(data);
          console.log('✅ Pacientes carregados:', Array.isArray(pacientes) ? pacientes.length : 'formato inválido');
          if (Array.isArray(pacientes) && pacientes.length > 0) {
            console.log('✅ Primeiro paciente:', pacientes[0].id, '-', pacientes[0].nome);
          }
        } catch (e) {
          console.error('❌ Erro ao parsear pacientes:', e.message);
        }
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro ao testar pacientes:', error.message);
  });

  req.end();
}