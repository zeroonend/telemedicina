import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Phone, Filter, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

interface Consulta {
  id: string;
  data_hora: string;
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'finalizada' | 'cancelada';
  especialidade: string;
  observacoes?: string;
  link_video?: string;
  valor: number;
  criado_em: string;
  medico: {
    id: string;
    nome: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  consultas: Consulta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MinhasConsultas() {
  const { user } = useAuthStore();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [erro, setErro] = useState<string>('');

  // Função para buscar consultas da API
  const buscarConsultas = async () => {
    if (!user) return;
    
    setCarregando(true);
    setErro('');
    
    try {
      let url = `${API_BASE_URL}/consultas`;
      const params = new URLSearchParams();
      
      if (filtroStatus) {
        params.append('status', filtroStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar consultas');
      }
      
      const data: ApiResponse = await response.json();
      setConsultas(data.consultas || []);
      
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      setErro('Erro ao carregar consultas. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // Função para cancelar consulta
  const cancelarConsulta = async (consultaId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/consultas/${consultaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelada' })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao cancelar consulta');
      }
      
      // Atualizar lista de consultas
      await buscarConsultas();
      
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      alert('Erro ao cancelar consulta. Tente novamente.');
    }
  };

  // Função para formatar data e hora
  const formatarDataHora = (dataHora: string) => {
    const data = new Date(dataHora);
    return {
      data: data.toLocaleDateString('pt-BR'),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendada': return <Calendar className="h-4 w-4" />;
      case 'confirmada': return <CheckCircle className="h-4 w-4" />;
      case 'em_andamento': return <Clock className="h-4 w-4" />;
      case 'finalizada': return <CheckCircle className="h-4 w-4" />;
      case 'cancelada': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Filtrar consultas por busca
  const consultasFiltradas = consultas.filter(consulta => {
    if (!busca) return true;
    const termoBusca = busca.toLowerCase();
    return (
      consulta.medico.nome.toLowerCase().includes(termoBusca) ||
      consulta.especialidade.toLowerCase().includes(termoBusca)
    );
  });

  useEffect(() => {
    buscarConsultas();
  }, [filtroStatus]);

  // Verificar se o usuário é paciente
  if (!user || user.tipo !== 'paciente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">Esta página é apenas para pacientes.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard-paciente" className="text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Consultas</h1>
            </div>
            <div className="text-sm text-gray-600">
              Olá, {user.nome}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Buscar por médico ou especialidade
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do médico ou especialidade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Filtrar por status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="agendada">Agendada</option>
                <option value="confirmada">Confirmada</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Consultas */}
        <div className="bg-white rounded-lg shadow-sm">
          {carregando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando consultas...</p>
            </div>
          ) : erro ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{erro}</p>
              <button
                onClick={buscarConsultas}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : consultasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma consulta encontrada</h3>
              <p className="text-gray-600 mb-4">
                {consultas.length === 0 
                  ? 'Você ainda não possui consultas agendadas.' 
                  : 'Nenhuma consulta corresponde aos filtros aplicados.'}
              </p>
              <Link
                to="/agendar-consulta"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Nova Consulta
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {consultasFiltradas.map((consulta) => {
                const { data, hora } = formatarDataHora(consulta.data_hora);
                const podeIniciarVideo = consulta.status === 'confirmada' || consulta.status === 'em_andamento';
                const podeCancelar = consulta.status === 'agendada' || consulta.status === 'confirmada';
                
                return (
                  <div key={consulta.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{consulta.medico.nome}</h3>
                            <p className="text-sm text-gray-600">{consulta.especialidade}</p>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consulta.status)}`}>
                            {getStatusIcon(consulta.status)}
                            <span className="ml-1 capitalize">{consulta.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{data}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{hora}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">R$ {consulta.valor.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {consulta.observacoes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Observações:</strong> {consulta.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-6">
                        {podeIniciarVideo && (
                          <Link
                            to={`/video-consulta/${consulta.id}`}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Iniciar Consulta
                          </Link>
                        )}
                        
                        {podeCancelar && (
                          <button
                            onClick={() => cancelarConsulta(consulta.id)}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Botão para agendar nova consulta */}
        {consultasFiltradas.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              to="/agendar-consulta"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Agendar Nova Consulta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}