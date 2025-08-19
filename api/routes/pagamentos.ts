import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
  apiVersion: '2025-07-30.basil'
});

// POST /api/pagamentos/cartao - Processar pagamento com cartão
router.post('/cartao', async (req: Request, res: Response) => {
  try {
    const { consultaId, valor, metadata } = req.body;

    if (!consultaId || !valor) {
      return res.status(400).json({ error: 'Consulta ID e valor são obrigatórios' });
    }

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(valor * 100), // Converter para centavos
      currency: 'brl',
      metadata: {
        consultaId: consultaId.toString(),
        ...metadata
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/pagamentos/pix - Gerar PIX
router.post('/pix', async (req: Request, res: Response) => {
  try {
    const { consultaId, valor } = req.body;

    if (!consultaId || !valor) {
      return res.status(400).json({ error: 'Consulta ID e valor são obrigatórios' });
    }

    // Simular geração de PIX
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}52040000530398654${valor.toFixed(2)}5802BR5925TELEMEDICINA LTDA6009SAO PAULO62070503***6304`;
    
    res.json({
      success: true,
      pixCode,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/pagamentos/boleto - Gerar boleto
router.post('/boleto', async (req: Request, res: Response) => {
  try {
    const { consultaId, valor } = req.body;

    if (!consultaId || !valor) {
      return res.status(400).json({ error: 'Consulta ID e valor são obrigatórios' });
    }

    // Simular geração de boleto
    const boletoCode = `34191.79001 01043.510047 91020.150008 1 ${Math.floor(Math.random() * 10000000000000)}`;
    
    res.json({
      success: true,
      boletoCode,
      boletoUrl: `https://example.com/boleto/${consultaId}`,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias
    });
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/pagamentos/status/:paymentId - Consultar status do pagamento
router.get('/status/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    res.json({
      success: true,
      status: 'pendente',
      paymentId
    });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/pagamentos/historico/:consultaId - Histórico de pagamentos
router.get('/historico/:consultaId', async (req: Request, res: Response) => {
  try {
    const { consultaId } = req.params;
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/pagamentos/webhook/stripe - Webhook do Stripe
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log('Webhook signature verification failed.');
      return res.status(400).send('Webhook Error');
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Pagamento bem-sucedido:', paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Pagamento falhou:', failedPayment.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;