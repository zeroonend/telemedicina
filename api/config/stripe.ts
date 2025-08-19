import Stripe from 'stripe';

// Configuração do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2025-07-30.basil'
});

export default stripe;

// Tipos para pagamentos
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

// Função para criar Payment Intent
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'brl',
  metadata?: Record<string, string>
): Promise<PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret || '',
    };
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    throw new Error('Falha ao processar pagamento');
  }
};

// Função para confirmar pagamento
export const confirmPayment = async (paymentIntentId: string): Promise<PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret || '',
    };
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    throw new Error('Falha ao confirmar pagamento');
  }
};

// Função para obter status do pagamento
export const getPaymentStatus = async (paymentIntentId: string): Promise<string> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  } catch (error) {
    console.error('Erro ao obter status do pagamento:', error);
    throw new Error('Falha ao obter status do pagamento');
  }
};