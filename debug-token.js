// Script para debugar o token no localStorage
import jwt from 'jsonwebtoken';

// Simular o que está no localStorage
const authStorage = {
  state: {
    user: {
      id: '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
      nome: 'Dr. Teste',
      email: 'medico@teste.com',
      tipo: 'medico'
    },
    token: jwt.sign(
      { id: '7e951e2b-4a41-48f3-ba0c-73a07dcd197c' },
      'telemedicina_jwt_secret_2024',
      { expiresIn: '24h' }
    ),
    isAuthenticated: true
  },
  version: 0
};

console.log('Token gerado:', authStorage.state.token);
console.log('Dados para localStorage:', JSON.stringify(authStorage));

// Verificar se o token é válido
try {
  const decoded = jwt.verify(authStorage.state.token, 'telemedicina_jwt_secret_2024');
  console.log('Token válido! Dados decodificados:', decoded);
} catch (error) {
  console.error('Token inválido:', error.message);
}