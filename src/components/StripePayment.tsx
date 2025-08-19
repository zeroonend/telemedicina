import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, CreditCard } from 'lucide-react';

// Configuração do Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentProps {
  consultaId: number;
  valor: number;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
}

// Componente interno do formulário de pagamento
const PaymentForm: React.FC<StripePaymentProps> = ({
  consultaId,
  valor,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  // Criar Payment Intent quando o componente carrega
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/pagamentos/processar-cartao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            consultaId,
            valor,
            metadata: {
              tipo: 'consulta_medica',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar pagamento');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError('Erro ao inicializar pagamento');
        onError('Erro ao inicializar pagamento');
      }
    };

    createPaymentIntent();
  }, [consultaId, valor, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Erro ao carregar formulário de pagamento');
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setError(error.message || 'Erro ao processar pagamento');
        onError(error.message || 'Erro ao processar pagamento');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        });
      }
    } catch (err) {
      setError('Erro inesperado ao processar pagamento');
      onError('Erro inesperado ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento Seguro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total:</span>
            <span className="font-semibold">
              R$ {valor.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <Button
            type="submit"
            disabled={!stripe || loading || !clientSecret}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Pagar R$ ${valor.toFixed(2).replace('.', ',')}`
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Seus dados estão protegidos com criptografia SSL
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

// Componente principal com provider do Stripe
const StripePayment: React.FC<StripePaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;