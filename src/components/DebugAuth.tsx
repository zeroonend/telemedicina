import React from 'react';
import { useAuthStore } from '../store/authStore';

const DebugAuth: React.FC = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  
  const testAPI = async () => {
    console.log('🔍 Estado do AuthStore:', {
      user: user ? { id: user.id, nome: user.nome, tipo: user.tipo } : null,
      token: token ? `${token.substring(0, 20)}...` : null,
      isAuthenticated,
      hasToken: !!token
    });
    
    if (!token) {
      console.error('❌ Token não encontrado no authStore');
      return;
    }
    
    try {
      console.log('🚀 Testando API prescrições com token do authStore...');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/prescricoes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API funcionou:', data);
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na API:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>🔍 Debug Auth</h4>
      <p><strong>Usuário:</strong> {user?.nome || 'Não logado'}</p>
      <p><strong>Tipo:</strong> {user?.tipo || 'N/A'}</p>
      <p><strong>Autenticado:</strong> {isAuthenticated ? '✅' : '❌'}</p>
      <p><strong>Token:</strong> {token ? '✅' : '❌'}</p>
      <button onClick={testAPI} style={{ marginTop: '5px', padding: '5px' }}>
        Testar API
      </button>
    </div>
  );
};

export default DebugAuth;