import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'paciente' | 'medico' | 'admin';
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  especialidade?: string;
  crm?: string;
  avatar?: string;
  criado_em: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: 'paciente' | 'medico';
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  especialidade?: string;
  crm?: string;
}

type AuthStore = AuthState & AuthActions;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Ações
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar conta');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      refreshToken: async () => {
        const { token } = get();
        
        if (!token) {
          throw new Error('Token não encontrado');
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao renovar token');
          }

          set({
            token: data.token,
            user: data.user,
          });
        } catch (error) {
          // Se falhar ao renovar token, fazer logout
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook para fazer requisições autenticadas
export const useAuthenticatedFetch = () => {
  const { token, logout } = useAuthStore();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as any).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se receber 401, fazer logout automático
    if (response.status === 401) {
      logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
  };

  return authenticatedFetch;
};

// Utilitário para verificar se o usuário tem uma role específica
export const useUserRole = () => {
  const { user } = useAuthStore();
  
  const hasRole = (role: 'paciente' | 'medico' | 'admin') => {
    return user?.tipo === role;
  };
  
  const isPaciente = () => hasRole('paciente');
  const isMedico = () => hasRole('medico');
  const isAdmin = () => hasRole('admin');
  
  return {
    hasRole,
    isPaciente,
    isMedico,
    isAdmin,
    userType: user?.tipo,
  };
};