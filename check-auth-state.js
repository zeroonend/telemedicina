// Script para verificar o estado de autenticação no localStorage
import fs from 'fs';
import path from 'path';

// Simular o que o navegador faria
console.log('=== Verificando Estado de Autenticação ===\n');

// Verificar se existe algum arquivo de configuração do Zustand
const possiblePaths = [
  './src/stores/authStore.ts',
  './src/store/authStore.ts',
  './src/stores/auth.ts'
];

for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ Encontrado: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Procurar pela chave de persistência
    const persistMatch = content.match(/name:\s*['"]([^'"]+)['"]/g);
    if (persistMatch) {
      console.log(`🔑 Chave de persistência encontrada: ${persistMatch}`);
    }
    
    // Procurar por configurações de storage
    const storageMatch = content.match(/storage:\s*([^,}]+)/g);
    if (storageMatch) {
      console.log(`💾 Configuração de storage: ${storageMatch}`);
    }
  }
}

console.log('\n=== Instruções para Debug ===');
console.log('1. Abra o navegador em http://localhost:5173');
console.log('2. Abra o DevTools (F12)');
console.log('3. Vá para a aba Application > Local Storage');
console.log('4. Procure por chaves como "auth-storage" ou similar');
console.log('5. Verifique se existe um token válido');
console.log('\n=== Teste Manual ===');
console.log('No console do navegador, execute:');
console.log('localStorage.getItem("auth-storage")');
console.log('JSON.parse(localStorage.getItem("auth-storage") || "{}").state?.token');