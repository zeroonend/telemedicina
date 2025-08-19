import { useState, useEffect } from 'react';
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
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  MessageCircle,
  Zap,
  Target,
  Award,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Consulta {
  id: string;
  paciente_id: string;
  medico_id: string;
  data_consulta: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  tipo: 'presencial' | 'online';
  valor?: number;
  observacoes?: string;
  nome_paciente?: string;
  nome_medico?: string;
  paciente?: {
    id: string;
    nome: string;
  };
}

interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  cpf?: string;
  endereco?: string;
  tipo: 'paciente';
  created_at?: string;
}

interface Prescricao {
  id: string;
  consulta_id: string;
  paciente_id: string;
  medico_id: string;
  medicamentos: string;
  dosagem?: string;
  instrucoes?: string;
  observacoes?: string;
  data_prescricao: string;
  nome_paciente?: string;
  nome_medico?: string;
}

// Dados mock removidos - agora usando dados reais da API

// Dados mock removidos - agora usando dados reais da API

// Dados mock removidos - agora usando dados reais da API

// Dados para Analytics Avançados
const analyticsData = {
  // Dados de receita mensal
  receitaMensal: [
    { mes: 'Jul', receita: 3200, consultas: 21, meta: 4000 },
    { mes: 'Ago', receita: 3800, consultas: 25, meta: 4000 },
    { mes: 'Set', receita: 4200, consultas: 28, meta: 4000 },
    { mes: 'Out', receita: 3900, consultas: 26, meta: 4000 },
    { mes: 'Nov', receita: 4500, consultas: 30, meta: 4000 },
    { mes: 'Dez', receita: 5100, consultas: 34, meta: 4000 },
    { mes: 'Jan', receita: 4800, consultas: 32, meta: 5000 }
  ],
  
  // Distribuição de consultas por tipo
  tipoConsultas: [
    { name: 'Online', value: 65, color: '#3B82F6' },
    { name: 'Presencial', value: 35, color: '#10B981' }
  ],
  
  // Satisfação dos pacientes
  satisfacao: [
    { periodo: 'S1', satisfacao: 4.2, avaliacoes: 12 },
    { periodo: 'S2', satisfacao: 4.5, avaliacoes: 18 },
    { periodo: 'S3', satisfacao: 4.7, avaliacoes: 22 },
    { periodo: 'S4', satisfacao: 4.8, avaliacoes: 25 }
  ],
  
  // Horários mais procurados
  horariosPico: [
    { horario: '08:00', consultas: 8 },
    { horario: '09:00', consultas: 12 },
    { horario: '10:00', consultas: 15 },
    { horario: '11:00', consultas: 10 },
    { horario: '14:00', consultas: 18 },
    { horario: '15:00', consultas: 20 },
    { horario: '16:00', consultas: 16 },
    { horario: '17:00', consultas: 14 }
  ],
  
  // Especialidades mais atendidas
  especialidades: [
    { name: 'Cardiologia', value: 40, color: '#EF4444' },
    { name: 'Clínica Geral', value: 30, color: '#3B82F6' },
    { name: 'Dermatologia', value: 20, color: '#10B981' },
    { name: 'Outros', value: 10, color: '#F59E0B' }
  ]
};

// Notificações inteligentes
const notificacoes = [
  {
    id: '1',
    tipo: 'urgente',
    titulo: 'Consulta em 15 minutos',
    descricao: 'Ana Silva - Cardiologia',
    tempo: '15 min',
    icone: Clock,
    cor: 'text-red-600 bg-red-100'
  },
  {
    id: '2',
    tipo: 'info',
    titulo: 'Novo paciente cadastrado',
    descricao: 'Roberto Santos solicitou consulta',
    tempo: '1h',
    icone: User,
    cor: 'text-blue-600 bg-blue-100'
  },
  {
    id: '3',
    tipo: 'sucesso',
    titulo: 'Meta mensal atingida!',
    descricao: 'Parabéns! Você superou sua meta de consultas',
    tempo: '2h',
    icone: Target,
    cor: 'text-green-600 bg-green-100'
  }
];

export default function DashboardMedico() {
  const [activeTab, setActiveTab] = useState('agenda');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  
  // Estados para dados da API
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const handleSelecionarPaciente = (paciente: Paciente) => {
    setModalAberto(false);
    navigate(`/nova-prescricao/${paciente.id}`);
  };

  // Função para buscar consultas da API
  const buscarConsultas = async () => {
    try {
      if (!token) {
        setErro('Token de autenticação não encontrado');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/consultas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar consultas');
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada {success: true, consultas: Array}
      if (data.success && Array.isArray(data.consultas)) {
        // Mapear os dados da API para o formato esperado pelo frontend
        const consultasMapeadas = data.consultas.map(consulta => ({
          ...consulta,
          data_consulta: consulta.data_hora, // Mapear data_hora para data_consulta
          nome_paciente: consulta.paciente?.nome, // Mapear paciente.nome para nome_paciente
          tipo: consulta.link_video ? 'online' : 'presencial' // Determinar tipo baseado no link_video
        }));
        setConsultas(consultasMapeadas);
      } else if (Array.isArray(data)) {
        // Mapear os dados da API para o formato esperado pelo frontend
        const consultasMapeadas = data.map(consulta => ({
          ...consulta,
          data_consulta: consulta.data_hora, // Mapear data_hora para data_consulta
          nome_paciente: consulta.paciente?.nome, // Mapear paciente.nome para nome_paciente
          tipo: consulta.link_video ? 'online' : 'presencial' // Determinar tipo baseado no link_video
        }));
        setConsultas(consultasMapeadas);
      } else {
        console.warn('API retornou dados de consultas em formato inesperado:', data);
        setConsultas([]);
      }
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      setErro('Erro ao carregar consultas. Tente novamente.');
    }
  };

  // Função para buscar pacientes da API
  const buscarPacientes = async () => {
    try {
      console.log('🔄 Iniciando busca de pacientes...');
      if (!token) {
        console.error('❌ Token não encontrado');
        setErro('Token de autenticação não encontrado');
        return;
      }

      console.log('🌐 Fazendo requisição para API de pacientes...');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/usuarios?tipo=paciente`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar pacientes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Dados de pacientes recebidos da API:', data);
      console.log('📊 Tipo dos dados:', typeof data);
      console.log('📊 É array?', Array.isArray(data));
      
      // Verificar se a resposta tem a estrutura esperada {success: true, usuarios: Array}
      if (data.success && Array.isArray(data.usuarios)) {
        console.log('✅ Pacientes carregados (formato success):', data.usuarios.length, 'pacientes');
        console.log('👥 Primeiro paciente:', data.usuarios[0]);
        setPacientes(data.usuarios);
      } else if (Array.isArray(data)) {
        console.log('✅ Pacientes carregados (formato array):', data.length, 'pacientes');
        console.log('👥 Primeiro paciente:', data[0]);
        setPacientes(data);
      } else {
        console.warn('⚠️ API retornou dados de pacientes em formato inesperado:', data);
        console.warn('⚠️ Definindo pacientes como array vazio');
        setPacientes([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar pacientes:', error);
      setErro('Erro ao carregar pacientes. Tente novamente.');
      setPacientes([]);
    }
  };

  // Função para buscar prescrições da API
  const buscarPrescricoes = async () => {
    try {
      if (!token) {
        setErro('Token de autenticação não encontrado');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/prescricoes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar prescrições');
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada {success: true, prescricoes: Array}
      if (data.success && Array.isArray(data.prescricoes)) {
        setPrescricoes(data.prescricoes);
      } else if (Array.isArray(data)) {
        setPrescricoes(data);
      } else {
        console.warn('API retornou dados de prescrições em formato inesperado:', data);
        setPrescricoes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error);
      setErro('Erro ao carregar prescrições. Tente novamente.');
    }
  };

  // useEffect para carregar dados automaticamente
  useEffect(() => {
    console.log('🚀 DashboardMedico montado');
    console.log('🔍 Debug useEffect - Token:', token ? 'PRESENTE' : 'AUSENTE');
    console.log('🔍 Debug useEffect - Token completo:', token);
    console.log('🔍 Debug useEffect - User:', user);
    
    if (token) {
      const carregarDados = async () => {
        setCarregando(true);
        setErro(null);
        
        console.log('🔄 Iniciando carregamento de dados...');
        
        // Adicionar delay para debug
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await Promise.all([
          buscarConsultas(),
          buscarPacientes(),
          buscarPrescricoes()
        ]);
        
        console.log('✅ Carregamento completo');
        console.log('📊 Estado final dos pacientes:', pacientes);
        console.log('📊 Quantidade de pacientes:', pacientes?.length || 0);
        
        setCarregando(false);
      };

      carregarDados();
    } else {
      console.log('❌ Nenhum token encontrado, redirecionando para login');
      navigate('/login');
    }
  }, [token, navigate]);

  // Adicionar log quando pacientes mudam
  useEffect(() => {
    console.log('📊 Pacientes atualizados:', {
      quantidade: pacientes?.length || 0,
      pacientes: pacientes,
      primeiroPaciente: pacientes?.[0],
      primeiroId: pacientes?.[0]?.id
    });
  }, [pacientes]);

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

  // Dados calculados - com verificação de segurança para evitar erro de filter
  const consultasArray = Array.isArray(consultas) ? consultas : [];
  
  const consultasHoje = consultasArray.filter(consulta => {
    const hoje = new Date().toISOString().split('T')[0];
    // Verificação de segurança para evitar erro de split em propriedade undefined
    return consulta.data_consulta && consulta.data_consulta.split('T')[0] === hoje;
  });

  const proximaConsulta = consultasArray
    .filter(consulta => consulta.data_consulta && new Date(consulta.data_consulta) > new Date())
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())[0];

  const consultasConcluidas = consultasArray.filter(c => c.status === 'concluida').length;
  const consultasPendentes = consultasArray.filter(c => c.status === 'agendada').length;

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
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Dr. {user?.nome}</p>
                  <p className="text-xs text-gray-500">{user?.especialidade || 'Médico'}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
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
                    onClick={() => setActiveTab('agenda')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'agenda'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Agenda
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('pacientes')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'pacientes'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Users className="mr-3 h-4 w-4" />
                    Pacientes
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
                    onClick={() => setActiveTab('financeiro')}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === 'financeiro'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <DollarSign className="mr-3 h-4 w-4" />
                    Financeiro
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
            {activeTab === 'agenda' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Consultas Hoje</p>
                      <p className="text-2xl font-bold text-gray-900">{consultasHoje.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Concluídas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {carregando ? '...' : consultasArray.filter(c => c.status === 'concluida').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {carregando ? '...' : consultasArray.filter(c => c.status === 'agendada').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                      <p className="text-2xl font-bold text-gray-900">4.8</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Próxima consulta */}
            {activeTab === 'agenda' && !carregando && proximaConsulta && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 mb-8 text-white">
                <h3 className="text-lg font-medium mb-4">Próxima Consulta</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{proximaConsulta.nome_paciente || 'Paciente'}</h4>
                      <p className="text-blue-100">Consulta agendada</p>
                      <div className="flex items-center mt-1 text-blue-100">
                        <Calendar className="h-3 w-3 mr-1" />
                        {proximaConsulta.data_consulta ? formatDate(proximaConsulta.data_consulta) : 'Data não informada'}
                        <Clock className="h-3 w-3 ml-2 mr-1" />
                        {proximaConsulta.data_consulta ? formatTime(proximaConsulta.data_consulta) : 'Horário não informado'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50">
                      Ver Histórico
                    </button>
                    {proximaConsulta.tipo === 'online' && proximaConsulta.status === 'agendada' && (
                      <button
                        onClick={() => navigate(`/video-consulta/${proximaConsulta.id}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Atender Paciente
                      </button>
                    )}
                    {proximaConsulta.tipo === 'presencial' && proximaConsulta.status === 'agendada' && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`http://localhost:3002/api/consultas/${proximaConsulta.id}`, {
                              method: 'PUT',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ status: 'em_andamento' })
                            });
                            
                            if (response.ok) {
                              // Atualizar lista de consultas
                              await buscarConsultas();
                              // Navegar para página de consulta presencial
                              navigate(`/consulta-presencial/${proximaConsulta.id}`);
                            } else {
                              console.error('Erro ao iniciar consulta');
                            }
                          } catch (error) {
                            console.error('Erro ao iniciar consulta:', error);
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Iniciar Consulta
                      </button>
                    )}
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
                    {activeTab === 'agenda' && 'Agenda de Consultas'}
                    {activeTab === 'pacientes' && 'Meus Pacientes'}
                    {activeTab === 'prescricoes' && 'Prescrições Emitidas'}
                    {activeTab === 'financeiro' && 'Relatório Financeiro'}
                    {activeTab === 'perfil' && 'Meu Perfil Profissional'}
                  </h2>
                  
                  {(activeTab === 'prescricoes') && (
                    <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                      <DialogTrigger asChild>
                        <button 
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Prescrição
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Selecione um Paciente</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {pacientes.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">Nenhum paciente encontrado</p>
                          ) : (
                            pacientes.map((paciente) => (
                              <button
                                key={paciente.id}
                                onClick={() => handleSelecionarPaciente(paciente)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                              >
                                {paciente.nome} ({paciente.email})
                              </button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {(activeTab === 'agenda' || activeTab === 'pacientes' || activeTab === 'prescricoes') && (
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
                {activeTab === 'agenda' && (
                  <div className="space-y-4">
                    {carregando ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Carregando consultas...</p>
                      </div>
                    ) : erro ? (
                      <div className="text-center py-8">
                        <p className="text-red-500">{erro}</p>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    ) : consultasArray.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma consulta encontrada</p>
                      </div>
                    ) : (
                      consultasArray
                        .filter(consulta => {
                          if (searchTerm) {
                            return consulta.nome_paciente?.toLowerCase().includes(searchTerm.toLowerCase());
                          }
                          return true;
                        })
                        .map((consulta) => (
                          <div key={consulta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-500" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">{consulta.nome_paciente || 'Paciente'}</h3>
                                  <p className="text-sm text-gray-500">Consulta {consulta.tipo || 'presencial'}</p>
                                  <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {consulta.data_consulta ? formatDate(consulta.data_consulta) : 'Data não informada'}
                                    <Clock className="h-3 w-3 ml-2 mr-1" />
                                    {consulta.data_consulta ? formatTime(consulta.data_consulta) : 'Horário não informado'}
                                  </div>
                                  {consulta.observacoes && (
                                    <p className="text-xs text-gray-600 mt-1">{consulta.observacoes}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={cn(
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                  getStatusColor(consulta.status)
                                )}>
                                  {getStatusText(consulta.status)}
                                </span>
                                
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => navigate(`/historico-paciente/${consulta.paciente_id}`)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Ver Histórico
                                  </button>
                                  <button
                                    onClick={() => navigate(consulta.tipo === 'online' ? `/video-consulta/${consulta.id}` : `/consulta-presencial/${consulta.id}`)}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                  >
                                    Nova Prescrição
                                  </button>
                                  {consulta.tipo === 'online' && consulta.status === 'agendada' && (
                                    <button
                                      onClick={() => navigate(`/video-consulta/${consulta.id}`)}
                                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 flex items-center space-x-1"
                                    >
                                      <Video className="h-4 w-4" />
                                      <span>Atender Paciente</span>
                                    </button>
                                  )}
                                  {consulta.tipo === 'presencial' && consulta.status === 'agendada' && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`http://localhost:3002/api/consultas/${consulta.id}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ status: 'em_andamento' })
                                          });
                                          
                                          if (response.ok) {
                                            // Atualizar lista de consultas
                                            await buscarConsultas();
                                            // Navegar para página de consulta presencial
                                            navigate(`/consulta-presencial/${consulta.id}`);
                                          } else {
                                            console.error('Erro ao iniciar consulta');
                                          }
                                        } catch (error) {
                                          console.error('Erro ao iniciar consulta:', error);
                                        }
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center space-x-1"
                                    >
                                      <User className="h-4 w-4" />
                                      <span>Iniciar Consulta</span>
                                    </button>
                                  )}
                                </div>
                                
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
                    {carregando ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Carregando prescrições...</p>
                      </div>
                    ) : erro ? (
                      <div className="text-center py-8">
                        <p className="text-red-500">{erro}</p>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    ) : prescricoes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma prescrição encontrada</p>
                      </div>
                    ) : (
                      prescricoes
                        .filter(prescricao => {
                          if (searchTerm) {
                            return prescricao.nome_paciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   prescricao.medicamentos?.toLowerCase().includes(searchTerm.toLowerCase());
                          }
                          return true;
                        })
                        .map((prescricao) => (
                          <div key={prescricao.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-medium text-gray-900">{prescricao.nome_paciente || 'Paciente'}</h3>
                                  <span className="text-xs text-gray-500">{formatDate(prescricao.data_prescricao)}</span>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-sm text-gray-600 mb-2">Medicamentos prescritos:</p>
                                  <div className="text-sm text-gray-700">
                                    {prescricao.medicamentos || 'Medicamentos não informados'}
                                  </div>
                                </div>
                                
                                {prescricao.observacoes && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Observações:</p>
                                    <p className="text-sm text-gray-700">{prescricao.observacoes}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4 flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-800 text-sm">
                                  Editar
                                </button>
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

                {activeTab === 'financeiro' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                            <p className="text-2xl font-bold text-gray-900">R$ 4.500,00</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pagamentos Recebidos</p>
                            <p className="text-2xl font-bold text-gray-900">15</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pendentes</p>
                            <p className="text-2xl font-bold text-gray-900">3</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center py-12">
                      <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Relatório detalhado em breve</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Gráficos e análises financeiras serão implementados.
                      </p>
                    </div>
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
                            CRM
                          </label>
                          <input
                            type="text"
                            value={user?.crm || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                            readOnly
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Especialidade
                          </label>
                          <input
                            type="text"
                            value={user?.especialidade || ''}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            Valor da Consulta
                          </label>
                          <input
                            type="number"
                            placeholder="150.00"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Biografia Profissional
                        </label>
                        <textarea
                          rows={4}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Descreva sua experiência e especialidades..."
                        />
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