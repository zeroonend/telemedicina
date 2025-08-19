const http = require('http');

console.log('=== VERIFICANDO API E PACIENTES ===');

// Token do usuário logado (do criar-usuario-teste.js)
const tokenValido = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNiNDdjMGFkLTVlY2UtNDBmNS1iMDQzLTU3NzE5OTdkY2FkZiIsIm5vbWUiOiJEci4gVGVzdGUiLCJlbWFpbCI6ImRyLnRlc3RlQGV4YW1wbGUuY29tIiwidGlwbyI6Im1lZGljbyIsImNyZWF0ZWRfYXQiOiIyMDI1LTAxLTE3VDE5OjQ4OjI0LjI4MVoiLCJpYXQiOjE3MzcxMzgxMDR9.oZdF8nZ2t5b3VwYXNz';

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/usuarios?tipo=paciente',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + tokenValido,
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
    console.log('Resposta:', data);
    
    try {
      const response = JSON.parse(data);
      console.log('\n=== ANÁLISE ===');
      
      if (Array.isArray(response)) {
        console.log('✅ Formato array direto');
        console.log('📊 Pacientes:', response.length);
      } else if (response.success && Array.isArray(response.usuarios)) {
        console.log('✅ Formato {success: true, usuarios: [...]}');
        console.log('📊 Pacientes:', response.usuarios.length);
        if (response.usuarios.length > 0) {
          console.log('✅ Primeiro paciente ID:', response.usuarios[0].id);
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