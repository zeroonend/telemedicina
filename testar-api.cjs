const http = require('http');

// Token válido gerado pelo debug-token.js
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdlOTUxZTJiLTRhNDEtNDhmMy1iYTBjLTczYTA3ZGNkMTk3YyIsImlhdCI6MTc1NTQ1MjQ5MSwiZXhwIjoxNzU1NTM4ODkxfQ.-EhVuYRkZloyvu5Knln7pJciRehHqvQM4S6D2qziiA4';

console.log('=== TESTANDO API COM TOKEN VÁLIDO ===');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/usuarios?tipo=paciente',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
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
      console.log('\n=== ANÁLISE DOS DADOS ===');
      
      if (Array.isArray(response)) {
        console.log('✅ Formato array direto');
        console.log('📊 Quantidade de pacientes:', response.length);
        if (response.length > 0) {
          console.log('✅ Primeiro paciente:', response[0]);
          console.log('✅ ID do primeiro paciente:', response[0].id);
        }
      } else if (response.success && Array.isArray(response.usuarios)) {
        console.log('✅ Formato {success: true, usuarios: [...]}');
        console.log('📊 Quantidade de pacientes:', response.usuarios.length);
        if (response.usuarios.length > 0) {
          console.log('✅ Primeiro paciente:', response.usuarios[0]);
          console.log('✅ ID do primeiro paciente:', response.usuarios[0].id);
        }
      } else {
        console.log('❌ Formato inesperado:', response);
      }
    } catch (e) {
      console.error('Erro ao parsear JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.end();