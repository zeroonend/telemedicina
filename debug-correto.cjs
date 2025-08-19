const http = require('http');

console.log('=== DEBUG COM ROTAS CORRETAS ===');

// Função para fazer login com rota correta
function fazerLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'medico@teste.com',
      senha: 'teste123'
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
        console.log('Login Status:', res.statusCode);
        console.log('Login Resposta:', data);
        
        try {
          const response = JSON.parse(data);
          if (response.token) {
            console.log('✅ Token obtido com sucesso');
            resolve(response.token);
          } else {
            reject(new Error('Token não encontrado'));
          }
        } catch (e) {
          reject(new Error('Erro ao parsear login: ' + e.message));
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

// Função para testar diferentes rotas de pacientes
function testarRota(token, rota, descricao) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: rota,
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
        console.log(`\n--- ${descricao} ---`);
        console.log('Status:', res.statusCode);
        console.log('Resposta:', data);
        
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response, rota: rota });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, rota: rota });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro na rota ${rota}:`, error.message);
      resolve({ status: 0, data: error.message, rota: rota });
    });

    req.end();
  });
}

// Executar fluxo completo
fazerLogin()
  .then(token => {
    console.log('\n=== TESTANDO DIFERENTES ROTAS ===');
    
    // Testar várias rotas possíveis para pacientes
    const rotas = [
      '/api/usuarios?tipo=paciente',
      '/api/pacientes',
      '/api/usuarios/pacientes',
      '/api/consultas/pacientes',
      '/api/historico-medico'
    ];
    
    return Promise.all(
      rotas.map(rota => testarRota(token, rota, `Rota: ${rota}`))
    );
  })
  .then(resultados => {
    console.log('\n=== RESUMO DOS TESTES ===');
    resultados.forEach(result => {
      console.log(`${result.rota}: Status ${result.status}`);
    });
    
    // Encontrar a rota que funcionou
    const sucesso = resultados.find(r => r.status === 200);
    if (sucesso) {
      console.log('\n✅ Rota funcional encontrada:', sucesso.rota);
      
      let pacientes = [];
      if (Array.isArray(sucesso.data)) {
        pacientes = sucesso.data;
      } else if (sucesso.data.usuarios) {
        pacientes = sucesso.data.usuarios;
      } else if (sucesso.data.pacientes) {
        pacientes = sucesso.data.pacientes;
      }
      
      console.log('📊 Total de pacientes:', pacientes.length);
      if (pacientes.length > 0) {
        console.log('✅ Primeiro paciente ID:', pacientes[0].id);
        console.log('✅ Primeiro paciente Nome:', pacientes[0].nome);
      }
    } else {
      console.log('\n❌ Nenhuma rota retornou status 200');
    }
  })
  .catch(error => {
    console.error('❌ Erro no fluxo:', error.message);
  });