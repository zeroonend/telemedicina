import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, ArrowLeft, Receipt } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import StripePayment from '../components/StripePayment';

interface Consulta {
  id: string;
  medico: {
    nome: string;
    especialidade: string;
  };
  dataHora: string;
  valor: number;
  status: 'agendada' | 'finalizada' | 'cancelada';
}

interface Pagamento {
  id: string;
  consultaId: string;
  valor: number;
  metodo: 'cartao' | 'pix' | 'boleto';
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado';
  dataVencimento?: string;
  dataPagamento?: string;
  transacaoId?: string;
}

interface DadosCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  cpf: string;
}

export default function Pagamentos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const consultaId = searchParams.get('consulta');
  
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix' | 'boleto'>('cartao');
  const [dadosCartao, setDadosCartao] = useState<DadosCartao>({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    cpf: ''
  });
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [boletoUrl, setBoletoUrl] = useState('');

  useEffect(() => {
    if (consultaId) {
      carregarConsulta();
    }
  }, [consultaId]);

  const carregarConsulta = async () => {
    try {
      // Simular carregamento da consulta
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockConsulta: Consulta = {
        id: consultaId!,
        medico: {
          nome: 'Dr. João Santos',
          especialidade: 'Cardiologia'
        },
        dataHora: '2024-01-15T14:00:00',
        valor: 150.00,
        status: 'agendada'
      };
      
      setConsulta(mockConsulta);
      
      // Verificar se já existe pagamento para esta consulta
      const mockPagamento: Pagamento = {
        id: 'pag_' + consultaId,
        consultaId: consultaId!,
        valor: mockConsulta.valor,
        metodo: 'cartao',
        status: 'pendente'
      };
      
      setPagamento(mockPagamento);
      
    } catch (error) {
      console.error('Erro ao carregar consulta:', error);
      setErro('Erro ao carregar dados da consulta');
    }
  };

  const processarPagamentoCartao = async () => {
    try {
      setProcessando(true);
      setErro('');
      
      // Validações básicas
      if (!dadosCartao.numero || !dadosCartao.nome || !dadosCartao.validade || !dadosCartao.cvv) {
        throw new Error('Preencha todos os campos do cartão');
      }
      
      if (dadosCartao.numero.replace(/\s/g, '').length < 16) {
        throw new Error('Número do cartão inválido');
      }
      
      if (dadosCartao.cvv.length < 3) {
        throw new Error('CVV inválido');
      }
      
      // Simular processamento com Stripe
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular resposta de sucesso (90% de chance)
      if (Math.random() > 0.1) {
        setPagamento(prev => prev ? {
          ...prev,
          status: 'aprovado',
          dataPagamento: new Date().toISOString(),
          transacaoId: 'txn_' + Math.random().toString(36).substr(2, 9)
        } : null);
        setSucesso(true);
      } else {
        throw new Error('Pagamento rejeitado pelo banco. Verifique os dados do cartão.');
      }
      
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro no processamento');
    } finally {
      setProcessando(false);
    }
  };

  const gerarPix = async () => {
    try {
      setProcessando(true);
      setErro('');
      
      // Simular geração de código PIX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPixCode = '00020126580014BR.GOV.BCB.PIX013636c4b8e1-4e8a-4c3a-9f2a-8b7c6d5e4f3g5204000053039865802BR5925CLINICA TELEMEDICINA LTDA6009SAO PAULO62070503***6304' + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      setPixCode(mockPixCode);
      setPagamento(prev => prev ? {
        ...prev,
        status: 'processando',
        dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      } : null);
      
    } catch (error) {
      setErro('Erro ao gerar código PIX');
    } finally {
      setProcessando(false);
    }
  };

  const gerarBoleto = async () => {
    try {
      setProcessando(true);
      setErro('');
      
      // Simular geração de boleto
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockBoletoUrl = 'https://example.com/boleto/' + consultaId + '.pdf';
      
      setBoletoUrl(mockBoletoUrl);
      setPagamento(prev => prev ? {
        ...prev,
        status: 'processando',
        dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias
      } : null);
      
    } catch (error) {
      setErro('Erro ao gerar boleto');
    } finally {
      setProcessando(false);
    }
  };

  const processarPagamento = () => {
    switch (metodoPagamento) {
      case 'cartao':
        // Handled by StripePayment component
        break;
      case 'pix':
        gerarPix();
        break;
      case 'boleto':
        gerarBoleto();
        break;
    }
  };

  const handlePagamentoSucesso = (paymentResult: any) => {
    setSucesso(true);
    setPagamento(prev => prev ? {
      ...prev,
      status: 'aprovado',
      dataPagamento: new Date().toISOString(),
      transacaoId: paymentResult.paymentIntentId
    } : null);
  };

  const handlePagamentoErro = (error: string) => {
    setErro(error);
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(pixCode);
    // Aqui você poderia mostrar um toast de sucesso
  };

  if (!user || user.tipo !== 'paciente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Apenas pacientes podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard-paciente')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Pagamento da Consulta</h1>
          <p className="text-gray-600 mt-2">Complete o pagamento para confirmar sua consulta</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo da Consulta */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo da Consulta</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Médico</label>
                  <p className="text-gray-900">{consulta.medico.nome}</p>
                  <p className="text-sm text-gray-600">{consulta.medico.especialidade}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Data e Hora</label>
                  <p className="text-gray-900">{formatarData(consulta.dataHora)}</p>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatarValor(consulta.valor)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Área de Pagamento */}
          <div className="lg:col-span-2">
            {sucesso ? (
              /* Tela de Sucesso */
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h2>
                <p className="text-gray-600 mb-6">
                  Sua consulta foi confirmada. Você receberá um e-mail com os detalhes.
                </p>
                
                {pagamento?.transacaoId && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">ID da Transação</p>
                    <p className="font-mono text-gray-900">{pagamento.transacaoId}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard-paciente')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Voltar ao Dashboard
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    Imprimir Comprovante
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de Pagamento */
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Método de Pagamento</h2>
                
                {/* Seleção do Método */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      metodoPagamento === 'cartao'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Cartão</span>
                  </button>
                  
                  <button
                    onClick={() => setMetodoPagamento('pix')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      metodoPagamento === 'pix'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">PIX</span>
                  </button>
                  
                  <button
                    onClick={() => setMetodoPagamento('boleto')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      metodoPagamento === 'boleto'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Boleto</span>
                  </button>
                </div>

                {/* Formulário do Cartão */}
                {metodoPagamento === 'cartao' && (
                  <StripePayment
                     consultaId={parseInt(consulta.id.toString())}
                     valor={consulta.valor}
                     onSuccess={handlePagamentoSucesso}
                     onError={handlePagamentoErro}
                   />
                )}

                {/* Área do PIX */}
                {metodoPagamento === 'pix' && pixCode && (
                  <div className="text-center space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Código PIX:</p>
                      <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                        {pixCode}
                      </div>
                      <button
                        onClick={copiarPix}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Copiar código
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Válido até: {pagamento?.dataVencimento && formatarData(pagamento.dataVencimento)}
                    </div>
                  </div>
                )}

                {/* Área do Boleto */}
                {metodoPagamento === 'boleto' && boletoUrl && (
                  <div className="text-center space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">Seu boleto foi gerado com sucesso!</p>
                      
                      <a
                        href={boletoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Receipt className="h-5 w-5 mr-2" />
                        Baixar Boleto
                      </a>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Vencimento: {pagamento?.dataVencimento && formatarData(pagamento.dataVencimento)}
                    </div>
                  </div>
                )}

                {/* Mensagens de Erro */}
                {erro && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                      <p className="text-red-700">{erro}</p>
                    </div>
                  </div>
                )}

                {/* Botão de Pagamento */}
                {!pixCode && !boletoUrl && (
                  <button
                    onClick={processarPagamento}
                    disabled={processando}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      `Pagar ${formatarValor(consulta.valor)}`
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}