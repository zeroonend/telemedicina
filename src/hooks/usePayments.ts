import { useState, useCallback } from 'react';
import { useAuthenticatedFetch } from '../store/authStore';

interface PaymentData {
  consultaId: string;
  valor: number;
  metodo: 'cartao' | 'pix' | 'boleto';
  dadosCartao?: {
    numero: string;
    nome: string;
    validade: string;
    cvv: string;
    cpf: string;
  };
}

interface PaymentResponse {
  success: boolean;
  transacaoId?: string;
  pixCode?: string;
  boletoUrl?: string;
  erro?: string;
}

interface PaymentStatus {
  id: string;
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado';
  valor: number;
  metodo: string;
  dataVencimento?: string;
  dataPagamento?: string;
  transacaoId?: string;
}

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const processPayment = useCallback(async (paymentData: PaymentData): Promise<PaymentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/pagamentos/processar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no processamento do pagamento');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const processarPagamentoCartao = async (dadosPagamento: {
    consultaId: number;
    valor: number;
    metadata?: Record<string, string>;
  }) => {
    try {
      const response = await authenticatedFetch('/api/pagamentos/processar-cartao', {
        method: 'POST',
        body: JSON.stringify(dadosPagamento),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar pagamento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  };

  const getPaymentStatus = useCallback(async (paymentId: string): Promise<PaymentStatus> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`/api/pagamentos/${paymentId}/status`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao consultar status do pagamento');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const getPaymentHistory = useCallback(async (): Promise<PaymentStatus[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/pagamentos/historico');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar histórico de pagamentos');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const generatePix = useCallback(async (consultaId: string, valor: number): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/pagamentos/pix/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consultaId, valor }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar código PIX');
      }

      const result = await response.json();
      return result.pixCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const generateBoleto = useCallback(async (consultaId: string, valor: number): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/api/pagamentos/boleto/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consultaId, valor }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar boleto');
      }

      const result = await response.json();
      return result.boletoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const validateCard = useCallback((cardData: PaymentData['dadosCartao']): string[] => {
    const errors: string[] = [];

    if (!cardData) {
      errors.push('Dados do cartão são obrigatórios');
      return errors;
    }

    // Validar número do cartão
    const cardNumber = cardData.numero.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 16) {
      errors.push('Número do cartão inválido');
    }

    // Validar nome
    if (!cardData.nome || cardData.nome.trim().length < 2) {
      errors.push('Nome no cartão é obrigatório');
    }

    // Validar validade
    if (!cardData.validade || !/^\d{2}\/\d{2}$/.test(cardData.validade)) {
      errors.push('Data de validade inválida (MM/AA)');
    } else {
      const [month, year] = cardData.validade.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const cardYear = parseInt(year);
      const cardMonth = parseInt(month);
      
      if (cardMonth < 1 || cardMonth > 12) {
        errors.push('Mês de validade inválido');
      }
      
      if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        errors.push('Cartão expirado');
      }
    }

    // Validar CVV
    if (!cardData.cvv || cardData.cvv.length < 3) {
      errors.push('CVV inválido');
    }

    // Validar CPF
    if (!cardData.cpf || !isValidCPF(cardData.cpf)) {
      errors.push('CPF inválido');
    }

    return errors;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    processPayment,
    getPaymentStatus,
    getPaymentHistory,
    generatePix,
    generateBoleto,
    validateCard,
    clearError,
  };
}

// Função auxiliar para validar CPF
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export default usePayments;