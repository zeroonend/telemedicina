import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  Video, 
  Star,
  Bell,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Heart,
  Pill,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface Consulta {
  id: string;
  medico: {
    nome: string;
    especialidade: string;
    foto?: string;
  };
  dataHora: string;
  status: 'agendada' | 'em_andamento' | 'finalizada' | 'cancelada';
  tipo: 'presencial' | 'online';
  valor: number;
}

interface Prescricao {
  id: string;
  medico: string;
  medicamentos: string[];
  data: string;
  observacoes: string;
}

// Dados mock removidos - agora usando API real

export default function DashboardPaciente() {
  const [activeTab, setActiveTab] = useState('consultas');
  const [searchTerm, setSearchTerm] = useState('');
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPrescricoes, setCarregandoPrescricoes] = useState(false);
  const [erro, setErro] = useState('');
  const [erroPrescricoes, setErroPrescricoes] = useState('');
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();

  // Função para buscar consultas da API
  const buscarConsultas = async () => {
    try {
      setCarregando(true);
      setErro('');
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      
      const response = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar consultas: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada {success: true, consultas: Array}
      let consultasArray = [];
      if (data.success && Array.isArray(data.consultas)) {
        consultasArray = data.consultas;
      } else if (Array.isArray(data)) {
        consultasArray = data;
      } else {
        console.warn('API retornou dados em formato inesperado:', data);
        setConsultas([]);
        return;
      }
      
      // Mapear dados da API para o formato esperado pelo componente
      const consultasFormatadas = consultasArray.map((consulta: any) => ({
        id: consulta.id.toString(),
        medico: {
          nome: consulta.medico_nome || 'Médico não informado',
          especialidade: consulta.especialidade || 'Especialidade não informada',
          foto: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20portrait%20white%20coat%20stethoscope%20friendly%20smile&image_size=square'
        },
        dataHora: consulta.data_hora,
        status: consulta.status || 'agendada',
        tipo: 'online' as 'online' | 'presencial', // Por padrão, todas as consultas são online
        valor: parseFloat(consulta.valor) || 0
      }));
      
      setConsultas(consultasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      setErro('Erro ao carregar consultas. Tente novamente.');
      // Garantir que consultas seja sempre um array
      setConsultas([]);
    } finally {
      setCarregando(false);
    }
  };

  // Função para buscar prescrições da API
  const buscarPrescricoes = async () => {
    try {
      setCarregandoPrescricoes(true);
      setErroPrescricoes('');
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      
      const response = await fetch(`${API_BASE_URL}/prescricoes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar prescrições: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada {success: true, prescricoes: Array}
      let prescricoesArray = [];
      if (data.success && Array.isArray(data.prescricoes)) {
        prescricoesArray = data.prescricoes;
      } else if (Array.isArray(data)) {
        prescricoesArray = data;
      } else {
        console.warn('API retornou dados de prescrições em formato inesperado:', data);
        setPrescricoes([]);
        return;
      }
      
      // Mapear dados da API para o formato esperado pelo componente
      const prescricoesFormatadas = prescricoesArray.map((prescricao: any) => ({
        id: prescricao.id.toString(),
        medico: prescricao.medico_nome || 'Médico não informado',
        medicamentos: Array.isArray(prescricao.medicamentos) ? prescricao.medicamentos : [],
        data: prescricao.data_prescricao || prescricao.created_at,
        observacoes: prescricao.observacoes || ''
      }));
      
      setPrescricoes(prescricoesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error);
      setErroPrescricoes('Erro ao carregar prescrições. Tente novamente.');
      setPrescricoes([]);
    } finally {
      setCarregandoPrescricoes(false);
    }
  };

  // Carregar consultas e prescrições ao montar o componente
  useEffect(() => {
    if (token) {
      buscarConsultas();
      buscarPrescricoes();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'finalizada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'em_andamento': return 'Em Andamento';
      case 'finalizada': return 'Finalizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const proximaConsulta = consultas.find(c => c.status === 'agendada');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TeleMedicina</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                  <p className="text-xs text-gray-500">Paciente</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('consultas')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'consultas'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Consultas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('prescricoes')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'prescricoes'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Pill className="mr-3 h-4 w-4" />
                    Prescrições
                  </button>
                </li>
                <li>
                  <Link
                    to="/historico-medico"
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100"
                  >
                    <Activity className="mr-3 h-4 w-4" />
                    Histórico Médico
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('pagamentos')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'pagamentos'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <CreditCard className="mr-3 h-4 w-4" />
                    Pagamentos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('perfil')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'perfil'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Perfil
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Cards de resumo */}
            {activeTab === 'consultas' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Próxima Consulta</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {proximaConsulta ? formatDate(proximaConsulta.dataHora) : 'Nenhuma'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Consultas Realizadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {consultas.filter(c => c.status === 'finalizada').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avaliações Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">1</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo principal */}
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header da seção */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {activeTab === 'consultas' && 'Minhas Consultas'}
                    {activeTab === 'prescricoes' && 'Minhas Prescrições'}
                    {activeTab === 'historico' && 'Histórico Médico'}
                    {activeTab === 'pagamentos' && 'Pagamentos'}
                    {activeTab === 'perfil' && 'Meu Perfil'}
                  </h2>
                  
                  {activeTab === 'consultas' && (
                    <div className="space-x-2">
                      <Link
                        to="/agendar-consulta"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nova Consulta</span>
                      </Link>
                      <Link
                        to="/pagamentos?consulta=cons_123"
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Pagamentos</span>
                      </Link>
                    </div>
                  )}
                </div>
                
                {(activeTab === 'consultas' || activeTab === 'prescricoes') && (
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </button>
                  </div>
                )}
              </div>

              {/* Conteúdo das abas */}
              <div className="p-6">
                {activeTab === 'consultas' && (
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Carregando consultas...</span>
                      </div>
                    ) : erro ? (
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-2">{erro}</div>
                        <button 
                          onClick={buscarConsultas}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    ) : consultas.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma consulta encontrada</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Você ainda não possui consultas agendadas.
                        </p>
                        <div className="mt-6">
                          <Link
                            to="/agendar-consulta"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Agendar Primeira Consulta</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      consultas.map((consulta) => (
                         <div key={consulta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-4">
                               <img
                                 src={consulta.medico.foto}
                                 alt={consulta.medico.nome}
                                 className="h-12 w-12 rounded-full object-cover"
                               />
                               <div>
                                 <h3 className="text-sm font-medium text-gray-900">{consulta.medico.nome}</h3>
                                 <p className="text-sm text-gray-500">{consulta.medico.especialidade}</p>
                                 <div className="flex items-center mt-1 text-xs text-gray-500">
                                   <Calendar className="h-3 w-3 mr-1" />
                                   {formatDate(consulta.dataHora)}
                                   <Clock className="h-3 w-3 ml-2 mr-1" />
                                   {formatTime(consulta.dataHora)}
                                 </div>
                               </div>
                             </div>
                             
                             <div className="flex items-center space-x-3">
                               <span className={cn(
                                 "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                 getStatusColor(consulta.status)
                               )}>
                                 {getStatusText(consulta.status)}
                               </span>
                               
                               {consulta.status === 'agendada' && consulta.tipo === 'online' && (
                                 <button 
                                   onClick={() => navigate(`/video-consulta/${consulta.id}`)}
                                   className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                 >
                                   <Video className="h-3 w-3 mr-1" />
                                   Entrar
                                 </button>
                               )}
                               
                               <button className="text-gray-400 hover:text-gray-600">
                                 <ChevronRight className="h-4 w-4" />
                               </button>
                             </div>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 )}

                {activeTab === 'prescricoes' && (
                  <div className="space-y-4">
                    {carregandoPrescricoes ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Carregando prescrições...</p>
                      </div>
                    ) : erroPrescricoes ? (
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-4">
                          <Pill className="mx-auto h-12 w-12" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">{erroPrescricoes}</h3>
                        <button
                          onClick={buscarPrescricoes}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    ) : prescricoes.length === 0 ? (
                      <div className="text-center py-12">
                        <Pill className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma prescrição encontrada</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Suas prescrições médicas aparecerão aqui após as consultas.
                        </p>
                      </div>
                    ) : (
                      prescricoes.map((prescricao) => (
                      <div key={prescricao.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium text-gray-900">{prescricao.medico}</h3>
                              <span className="text-xs text-gray-500">{formatDate(prescricao.data)}</span>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-2">Medicamentos:</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {(typeof prescricao.medicamentos === 'string' ? JSON.parse(prescricao.medicamentos) : prescricao.medicamentos).map((med: any, index: number) => (
                                   <li key={index}>{typeof med === 'string' ? med : med?.nome || 'Medicamento não especificado'}</li>
                                 ))}
                              </ul>
                            </div>
                            
                            {prescricao.observacoes && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Observações:</p>
                                <p className="text-sm text-gray-700">{prescricao.observacoes}</p>
                              </div>
                            )}
                          </div>
                          
                          <button className="ml-4 text-gray-400 hover:text-gray-600">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum histórico médico</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Seu histórico médico aparecerá aqui após as consultas.
                    </p>
                  </div>
                )}

                {activeTab === 'pagamentos' && (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pagamento</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Seus pagamentos aparecerão aqui.
                    </p>
                  </div>
                )}

                {activeTab === 'perfil' && (
                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={user?.nome || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefone
                          </label>
                          <input
                            type="tel"
                            value={user?.telefone || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={user?.email || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Cancelar
                        </button>
                        <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}