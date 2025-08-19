import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Calendar, User, Pill, Edit, Trash2, Eye, Download } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import DebugAuth from '../components/DebugAuth';
import { useParams, useLocation } from 'react-router-dom';

interface Medicamento {
  id: string;
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  instrucoes?: string;
}

interface Prescricao {
  id: string;
  paciente: {
    id: string;
    nome: string;
    cpf: string;
  };
  medico: {
    id: string;
    nome: string;
    crm: string;
    especialidade: string;
  };
  consulta: {
    id: string;
    dataHora: string;
  };
  medicamentos: Medicamento[];
  observacoes?: string;
  status: 'ativa' | 'cancelada' | 'expirada';
  dataEmissao: string;
  dataValidade: string;
  assinaturaDigital: string;
}

export default function Prescricoes() {
  const { user } = useAuthStore();
  const { pacienteId } = useParams();
  const location = useLocation();
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');
  
  // Estados para filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Estados para modal de nova prescrição
  const [modalAberto, setModalAberto] = useState(false);
  const [prescricaoSelecionada, setPrescricaoSelecionada] = useState<Prescricao | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  
  // Estados do formulário
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [consultaSelecionada, setConsultaSelecionada] = useState('');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([{
    id: '1',
    nome: '',
    dosagem: '',
    frequencia: '',
    duracao: '',
    instrucoes: ''
  }]);
  const [observacoes, setObservacoes] = useState('');

  // Estados para dados da API
  const [pacientesDisponiveis, setPacientesDisponiveis] = useState<Array<{id: string, nome: string, cpf: string}>>([]);
  const [consultasDisponiveis, setConsultasDisponiveis] = useState<Array<{id: string, paciente: string, paciente_id: string, data: string}>>([]);

  // Função para buscar prescrições da API
  const buscarPrescricoes = async () => {
    try {
      const { token } = useAuthStore.getState();
      console.log('🔍 Debug Token:', { token: token ? `${token.substring(0, 20)}...` : 'null', hasToken: !!token });
      const params = new URLSearchParams();
      
      if (busca) params.append('busca', busca);
      if (statusFiltro) params.append('status', statusFiltro);
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const response = await fetch(`http://localhost:3002/api/prescricoes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar prescrições');
      }
      
      const data = await response.json();
      
      // Mapear dados da API para o formato do frontend
      const prescricoesFormatadas = data.prescricoes.map((p: any) => ({
        id: p.id.toString(),
        paciente: {
          id: p.paciente.id.toString(),
          nome: p.paciente.nome,
          cpf: p.paciente.cpf || 'N/A'
        },
        medico: {
          id: p.medico.id.toString(),
          nome: p.medico.nome,
          crm: p.medico.crm,
          especialidade: p.medico.especialidade
        },
        consulta: {
          id: p.consulta_id.toString(),
          dataHora: p.consulta.data_consulta && p.consulta.horario ? new Date(p.consulta.data_consulta + 'T' + p.consulta.horario).toISOString() : new Date().toISOString()
        },
        medicamentos: (typeof p.medicamentos === 'string' ? JSON.parse(p.medicamentos) : p.medicamentos).map((m: any, index: number) => ({
          id: (index + 1).toString(),
          nome: m.nome,
          dosagem: m.dosagem,
          frequencia: m.frequencia,
          duracao: m.duracao,
          instrucoes: m.observacoes || ''
        })),
        observacoes: p.observacoes_gerais || '',
        status: p.status,
        dataEmissao: p.criado_em,
        dataValidade: new Date(new Date(p.criado_em).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias após criação
        assinaturaDigital: `SHA256:${p.id}...`
      }));
      
      return prescricoesFormatadas;
    } catch (error) {
      console.error('Erro ao buscar prescrições:', error);
      throw error;
    }
  };

  // Função para buscar consultas disponíveis
  const buscarConsultasDisponiveis = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch('http://localhost:3002/api/consultas?status=finalizada', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar consultas');
      }
      
      const data = await response.json();
      
      const consultasFormatadas = data.consultas.map((c: any) => ({
        id: c.id ? c.id.toString() : '',
        paciente: c.paciente_nome || 'Nome não disponível',
        paciente_id: c.paciente_id ? c.paciente_id.toString() : '',
        data: c.data_consulta && c.horario ? new Date(c.data_consulta + 'T' + c.horario).toISOString() : new Date().toISOString()
      })).filter(c => c.id && c.paciente_id); // Filtrar consultas com dados válidos
      
      setConsultasDisponiveis(consultasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
    }
  };

  // Função para buscar e selecionar consulta específica do paciente
  const buscarConsultasDoPaciente = async (pacienteIdParam: string) => {
    try {
      console.log('🔍 Buscando consultas do paciente:', pacienteIdParam);
      
      // Filtrar consultas do paciente específico
      const consultasDoPaciente = consultasDisponiveis.filter(c => c.paciente_id === pacienteIdParam);
      
      if (consultasDoPaciente.length > 0) {
        // Ordenar por data (mais recente primeiro) e selecionar a primeira
        const consultaMaisRecente = consultasDoPaciente.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )[0];
        
        setConsultaSelecionada(consultaMaisRecente.id);
        console.log('✅ Consulta selecionada automaticamente:', consultaMaisRecente.id, 'Data:', consultaMaisRecente.data);
      } else {
        console.log('⚠️ Nenhuma consulta finalizada encontrada para o paciente:', pacienteIdParam);
        setConsultaSelecionada('');
      }
    } catch (error) {
      console.error('Erro ao buscar consultas do paciente:', error);
    }
  };

  // Função para buscar pacientes (através da API de usuários)
  const buscarPacientes = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch('http://localhost:3002/api/usuarios?tipo=paciente', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes');
      }
      
      const data = await response.json();
      
      const pacientesFormatados = data.usuarios.map((p: any) => ({
        id: p.id.toString(),
        nome: p.nome,
        cpf: p.cpf || 'N/A'
      }));
      
      setPacientesDisponiveis(pacientesFormatados);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  // useEffect para detectar rota /nova-prescricao e abrir modal automaticamente
  useEffect(() => {
    if (location.pathname.includes('/nova-prescricao') && pacienteId && pacienteId !== 'undefined') {
      console.log('🔍 Paciente ID detectado na rota:', pacienteId);
      console.log('📋 Pacientes disponíveis:', pacientesDisponiveis.length);
      console.log('📅 Consultas disponíveis:', consultasDisponiveis.length);
      
      // Aguardar os pacientes serem carregados antes de selecionar
      if (pacientesDisponiveis.length > 0) {
        const pacienteEncontrado = pacientesDisponiveis.find(p => p.id === pacienteId);
        if (pacienteEncontrado) {
          setPacienteSelecionado(pacienteId);
          setModalAberto(true);
          setModoVisualizacao(false);
          console.log('✅ Paciente selecionado automaticamente:', pacienteEncontrado.nome);
          
          // Buscar e selecionar automaticamente a consulta mais recente do paciente
          if (consultasDisponiveis.length > 0) {
            buscarConsultasDoPaciente(pacienteId);
          } else {
            console.log('⚠️ Aguardando consultas serem carregadas...');
          }
        } else {
          console.log('❌ Paciente não encontrado na lista:', pacienteId);
        }
      } else {
        console.log('⚠️ Aguardando pacientes serem carregados...');
      }
    }
  }, [location.pathname, pacienteId, pacientesDisponiveis, consultasDisponiveis]);

  // useEffect para selecionar automaticamente consulta quando paciente é selecionado
  useEffect(() => {
    if (pacienteSelecionado && consultasDisponiveis.length > 0) {
      // Buscar consultas do paciente selecionado
      buscarConsultasDoPaciente(pacienteSelecionado);
    }
  }, [pacienteSelecionado, consultasDisponiveis]);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro('');
      
      try {
        // Carregar prescrições
        const prescricoesData = await buscarPrescricoes();
        setPrescricoes(prescricoesData);
        
        // Carregar dados auxiliares
        if (user?.tipo === 'medico') {
          await Promise.all([
            buscarPacientes(),
            buscarConsultasDisponiveis()
          ]);
        }
      } catch (error) {
        setErro('Erro ao carregar dados. Tente novamente.');
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [busca, statusFiltro, dataInicio, dataFim]);

  const adicionarMedicamento = () => {
    const novoMedicamento: Medicamento = {
      id: Date.now().toString(),
      nome: '',
      dosagem: '',
      frequencia: '',
      duracao: '',
      instrucoes: ''
    };
    setMedicamentos([...medicamentos, novoMedicamento]);
  };

  const removerMedicamento = (id: string) => {
    if (medicamentos.length > 1) {
      setMedicamentos(medicamentos.filter(m => m.id !== id));
    }
  };

  const atualizarMedicamento = (id: string, campo: keyof Medicamento, valor: string) => {
    setMedicamentos(medicamentos.map(m => 
      m.id === id ? { ...m, [campo]: valor } : m
    ));
  };

  const salvarPrescricao = async () => {
    if (!pacienteSelecionado || !consultaSelecionada || medicamentos.some(m => !m.nome || !m.dosagem)) {
      setErro('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setCarregando(true);
    try {
      const { token } = useAuthStore.getState();
      const dadosPrescricao = {
        consulta_id: parseInt(consultaSelecionada),
        medicamentos: medicamentos.map(m => ({
          nome: m.nome,
          dosagem: m.dosagem,
          frequencia: m.frequencia,
          duracao: m.duracao,
          observacoes: m.instrucoes || ''
        })),
        observacoes_gerais: observacoes
      };
      
      const url = prescricaoSelecionada 
        ? `http://localhost:3002/api/prescricoes/${prescricaoSelecionada.id}`
        : 'http://localhost:3002/api/prescricoes';
      
      const method = prescricaoSelecionada ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosPrescricao)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar prescrição');
      }
      
      setSucesso(prescricaoSelecionada ? 'Prescrição atualizada com sucesso!' : 'Prescrição criada com sucesso!');
      setModalAberto(false);
      resetarFormulario();
      
      // Recarregar prescrições
      const prescricoesData = await buscarPrescricoes();
      setPrescricoes(prescricoesData);
      
    } catch (error) {
      setErro('Erro ao salvar prescrição');
      console.error('Erro ao salvar prescrição:', error);
    } finally {
      setCarregando(false);
    }
  };

  const resetarFormulario = () => {
    setPacienteSelecionado('');
    setConsultaSelecionada('');
    setMedicamentos([{
      id: '1',
      nome: '',
      dosagem: '',
      frequencia: '',
      duracao: '',
      instrucoes: ''
    }]);
    setObservacoes('');
    setPrescricaoSelecionada(null);
    setModoVisualizacao(false);
  };

  const visualizarPrescricao = (prescricao: Prescricao) => {
    setPrescricaoSelecionada(prescricao);
    setModoVisualizacao(true);
    setModalAberto(true);
  };

  const editarPrescricao = (prescricao: Prescricao) => {
    setPrescricaoSelecionada(prescricao);
    setPacienteSelecionado(prescricao.paciente.id);
    setConsultaSelecionada(prescricao.consulta.id);
    setMedicamentos(prescricao.medicamentos);
    setObservacoes(prescricao.observacoes || '');
    setModoVisualizacao(false);
    setModalAberto(true);
  };

  const cancelarPrescricao = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar esta prescrição?')) {
      try {
        const { token } = useAuthStore.getState();
        const response = await fetch(`http://localhost:3002/api/prescricoes/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao cancelar prescrição');
        }
        
        setSucesso('Prescrição cancelada com sucesso!');
        
        // Recarregar prescrições
        const prescricoesData = await buscarPrescricoes();
        setPrescricoes(prescricoesData);
      } catch (error) {
        setErro('Erro ao cancelar prescrição');
        console.error('Erro ao cancelar prescrição:', error);
      }
    }
  };

  const baixarPrescricao = async (prescricao: Prescricao) => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`http://localhost:3002/api/prescricoes/${prescricao.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `prescricao_${prescricao.paciente.nome}_${new Date(prescricao.dataEmissao).toLocaleDateString('pt-BR')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSucesso('Download da prescrição iniciado!');
    } catch (error) {
      setErro('Erro ao baixar prescrição');
      console.error('Erro ao baixar prescrição:', error);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'expirada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.tipo !== 'medico') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DebugAuth />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">Esta página é apenas para médicos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugAuth />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Prescrições Médicas</h1>
            <button
              onClick={() => {
                resetarFormulario();
                setModalAberto(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Prescrição</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {erro && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{erro}</p>
            <button onClick={() => setErro('')} className="text-red-600 hover:text-red-800 ml-2">×</button>
          </div>
        )}
        
        {sucesso && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{sucesso}</p>
            <button onClick={() => setSucesso('')} className="text-green-600 hover:text-green-800 ml-2">×</button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Paciente ou medicamento"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="ativa">Ativa</option>
                <option value="cancelada">Cancelada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Lista de Prescrições */}
        <div className="bg-white rounded-lg shadow-sm">
          {carregando ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando prescrições...</p>
            </div>
          ) : prescricoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma prescrição encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicamentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescricoes.map(prescricao => (
                    <tr key={prescricao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {prescricao.paciente.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            CPF: {prescricao.paciente.cpf}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prescricao.medicamentos.map((med, index) => (
                            <div key={med.id} className="mb-1">
                              {med.nome} - {med.dosagem}
                              {index < prescricao.medicamentos.length - 1 && <br />}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(prescricao.dataEmissao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(prescricao.status)
                        }`}>
                          {prescricao.status.charAt(0).toUpperCase() + prescricao.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => visualizarPrescricao(prescricao)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => baixarPrescricao(prescricao)}
                            className="text-green-600 hover:text-green-900"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {prescricao.status === 'ativa' && (
                            <>
                              <button
                                onClick={() => editarPrescricao(prescricao)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => cancelarPrescricao(prescricao.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancelar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova/Editar Prescrição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modoVisualizacao ? 'Visualizar Prescrição' : 
                 prescricaoSelecionada ? 'Editar Prescrição' : 'Nova Prescrição'}
              </h3>
              <button
                onClick={() => {
                  setModalAberto(false);
                  resetarFormulario();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {modoVisualizacao && prescricaoSelecionada ? (
              /* Modo Visualização */
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Dados do Paciente</h4>
                    <p><strong>Nome:</strong> {prescricaoSelecionada.paciente.nome}</p>
                    <p><strong>CPF:</strong> {prescricaoSelecionada.paciente.cpf}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Dados do Médico</h4>
                    <p><strong>Nome:</strong> {prescricaoSelecionada.medico.nome}</p>
                    <p><strong>CRM:</strong> {prescricaoSelecionada.medico.crm}</p>
                    <p><strong>Especialidade:</strong> {prescricaoSelecionada.medico.especialidade}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Medicamentos Prescritos</h4>
                  <div className="space-y-3">
                    {(typeof prescricaoSelecionada.medicamentos === 'string' ? JSON.parse(prescricaoSelecionada.medicamentos) : prescricaoSelecionada.medicamentos).map((med: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3">
                        <p><strong>Medicamento:</strong> {med.nome}</p>
                        <p><strong>Dosagem:</strong> {med.dosagem}</p>
                        <p><strong>Frequência:</strong> {med.frequencia}</p>
                        <p><strong>Duração:</strong> {med.duracao}</p>
                        {med.instrucoes && <p><strong>Instruções:</strong> {med.instrucoes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                
                {prescricaoSelecionada.observacoes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                    <p className="text-gray-700">{prescricaoSelecionada.observacoes}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><strong>Data de Emissão:</strong> {formatarData(prescricaoSelecionada.dataEmissao)}</p>
                  <p><strong>Válida até:</strong> {formatarData(prescricaoSelecionada.dataValidade)}</p>
                </div>
              </div>
            ) : (
              /* Modo Edição/Criação */
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paciente *
                    </label>
                    <select
                      value={pacienteSelecionado}
                      onChange={(e) => setPacienteSelecionado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um paciente</option>
                      {pacientesDisponiveis.map(paciente => (
                        <option key={paciente.id} value={paciente.id}>
                          {paciente.nome} - {paciente.cpf}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consulta *
                    </label>
                    <select
                      value={consultaSelecionada}
                      onChange={(e) => setConsultaSelecionada(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione uma consulta</option>
                      {consultasDisponiveis.map(consulta => (
                        <option key={consulta.id} value={consulta.id}>
                          {consulta.paciente} - {formatarData(consulta.data)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Medicamentos *</h4>
                    <button
                      type="button"
                      onClick={adicionarMedicamento}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {medicamentos.map((med, index) => (
                      <div key={med.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Medicamento {index + 1}</h5>
                          {medicamentos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removerMedicamento(med.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome do Medicamento *
                            </label>
                            <input
                              type="text"
                              value={med.nome}
                              onChange={(e) => atualizarMedicamento(med.id, 'nome', e.target.value)}
                              placeholder="Ex: Paracetamol 500mg"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dosagem *
                            </label>
                            <input
                              type="text"
                              value={med.dosagem}
                              onChange={(e) => atualizarMedicamento(med.id, 'dosagem', e.target.value)}
                              placeholder="Ex: 500mg"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Frequência *
                            </label>
                            <input
                              type="text"
                              value={med.frequencia}
                              onChange={(e) => atualizarMedicamento(med.id, 'frequencia', e.target.value)}
                              placeholder="Ex: 3x ao dia"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duração *
                            </label>
                            <input
                              type="text"
                              value={med.duracao}
                              onChange={(e) => atualizarMedicamento(med.id, 'duracao', e.target.value)}
                              placeholder="Ex: 7 dias"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instruções Especiais
                          </label>
                          <textarea
                            value={med.instrucoes}
                            onChange={(e) => atualizarMedicamento(med.id, 'instrucoes', e.target.value)}
                            placeholder="Ex: Tomar após as refeições"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Gerais
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais sobre o tratamento..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAberto(false);
                      resetarFormulario();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarPrescricao}
                    disabled={carregando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {carregando ? 'Salvando...' : 'Salvar Prescrição'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}