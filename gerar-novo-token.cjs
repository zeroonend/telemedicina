const http = require('http');

console.log('=== GERANDO NOVO TOKEN VÁLIDO ===');

// Função para fazer login e obter novo token
function fazerLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'medico@teste.com',
      senha: 'teste123'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/login',
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
        try {
          const response = JSON.parse(data);
          if (response.token) {
            console.log('✅ Login bem-sucedido');
            console.log('Token:', response.token);
            resolve(response.token);
          } else {
            reject(new Error('Token não encontrado na resposta'));
          }
        } catch (e) {
          reject(new Error('Erro ao parsear resposta: ' + e.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função para testar API com o novo token
function testarAPI(token) {
  return new Promise((resolve, reject) => {
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
        console.log('\n=== TESTANDO API COM NOVO TOKEN ===');
        console.log('Status:', res.statusCode);
        console.log('Resposta:', data);
        
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Executar fluxo completo
fazerLogin()
  .then(token => testarAPI(token))
  .then(result => {
    console.log('\n=== RESULTADO FINAL ===');
    if (result.status === 200) {
      console.log('✅ API funcionando corretamente');
      
      let pacientes = [];
      if (Array.isArray(result.data)) {
        pacientes = result.data;
      } else if (result.data.usuarios) {
        pacientes = result.data.usuarios;
      } else if (result.data.pacientes) {
        pacientes = result.data.pacientes;
      }
      
      console.log('📊 Total de pacientes:', pacientes.length);
      
      if (pacientes.length > 0) {
        console.log('✅ Primeiro paciente ID:', pacientes[0].id);
        console.log('✅ Primeiro paciente Nome:', pacientes[0].nome);
      } else {
        console.log('❌ Nenhum paciente encontrado');
      }
    } else {
      console.log('❌ API retornou erro:', result.status);
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error.message);
  });