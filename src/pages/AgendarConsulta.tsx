import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Star, ArrowLeft, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// import { toast } from 'sonner'; // Removido temporariamente

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  valorConsulta: number;
  foto?: string;
  proximosHorarios: string[];
}

interface HorarioDisponivel {
  data: string;
  horarios: string[];
}

export default function AgendarConsulta() {
  const { user } = useAuthStore();
  const [medicosDisponiveis, setMedicosDisponiveis] = useState<Medico[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorarioDisponivel[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [carregandoAgendamento, setCarregandoAgendamento] = useState(false);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

  const especialidades = ['Cardiologia', 'Dermatologia', 'Pediatria', 'Ginecologia', 'Neurologia', 'Ortopedia'];

  // Função para buscar médicos da API
  const buscarMedicos = async () => {
    setCarregando(true);
    try {
      let url = `${API_BASE_URL}/usuarios?tipo=medico`;
      
      // Adicionar filtros se existirem
      if (especialidadeFiltro) {
        url += `&especialidade=${encodeURIComponent(especialidadeFiltro)}`;
      }
      if (busca) {
        url += `&busca=${encodeURIComponent(busca)}`;
      }
      
      // Obter token JWT do store de autenticação
      const { token } = useAuthStore.getState();
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar médicos');
      }
      
      const data = await response.json();
      
      // Debug: verificar dados recebidos da API
      // Transformar dados da API para o formato esperado pelo frontend
      const medicosFormatados = data.usuarios.map((medico: any) => {
        return {
          id: medico.id,
          nome: medico.nome,
          especialidade: medico.especialidade || 'Clínico Geral',
          crm: medico.crm || 'CRM não informado',
          avaliacaoMedia: 4.5, // Valor padrão - pode ser calculado posteriormente
          totalAvaliacoes: 0, // Valor padrão - pode ser calculado posteriormente
          valorConsulta: 150.00, // Valor padrão - pode vir de uma tabela de preços
          foto: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20${medico.especialidade?.toLowerCase()}%20white%20coat%20smiling&image_size=square`,
          proximosHorarios: [] // Será carregado quando o médico for selecionado
        };
      });
      
      setMedicosDisponiveis(medicosFormatados);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      console.error('Erro ao carregar lista de médicos');
    } finally {
      setCarregando(false);
    }
  };

  // Função para buscar horários disponíveis de um médico
  const buscarHorariosDisponiveis = async (medicoId: string, data: string) => {
    try {
      // Obter token JWT do store de autenticação
      const { token } = useAuthStore.getState();
      
      const response = await fetch(`${API_BASE_URL}/usuarios/medicos/horarios/${medicoId}?data=${data}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar horários');
      }
      
      const data_response = await response.json();
      return data_response.horarios_disponiveis || [];
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      console.error('Erro ao carregar horários disponíveis');
      return [];
    }
  };

  // Função para agendar consulta
  const agendarConsulta = async (medicoId: string, data: string, horario: string, especialidade: string) => {
    try {
      const dataHora = `${data} ${horario}`;
      
      // Obter token JWT do store de autenticação
      const { token } = useAuthStore.getState();
      
      const response = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          medico_id: medicoId,
          data_hora: `${data}T${horario}:00`,
          especialidade: especialidade,
          observacoes: 'Consulta online agendada pelo paciente'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao agendar consulta');
      }
      
      const responseData = await response.json();
      console.log('Consulta agendada com sucesso!');
      setSucesso('Consulta agendada com sucesso! Você receberá um e-mail de confirmação.');
      setMedicoSelecionado(null);
      setDataSelecionada('');
      setHorarioSelecionado('');
      
      // Atualizar lista de médicos para refletir horários ocupados
      buscarMedicos();
      
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      
      // Mensagens de erro mais específicas baseadas na resposta da API
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Dados inválidos para agendamento';
        setErro(errorMessage);
      } else if (error.response?.status === 401) {
        setErro('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 409) {
        setErro('Este horário não está mais disponível. Selecione outro horário.');
      } else if (error.response?.status === 500) {
        setErro('Erro interno do servidor. Tente novamente em alguns minutos.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setErro('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setErro('Erro ao agendar consulta. Tente novamente.');
      }
    }
  };

  useEffect(() => {
    // Carregar médicos ao montar o componente
    buscarMedicos();
  }, []);

  useEffect(() => {
    // Filtrar médicos baseado na especialidade selecionada
    if (especialidadeFiltro) {
      buscarMedicos(); // Recarregar com filtro
    }
  }, [especialidadeFiltro, busca]);



  // Função para selecionar médico e carregar horários disponíveis
  const handleSelecionarMedico = async (medico: Medico) => {
    setMedicoSelecionado(medico);
    setCarregando(true);
    
    try {
      // Gerar próximos 7 dias úteis
      const horariosData: HorarioDisponivel[] = [];
      const hoje = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);
        
        // Pular fins de semana
        if (data.getDay() === 0 || data.getDay() === 6) continue;
        
        const dataStr = data.toISOString().split('T')[0];
        const horarios = await buscarHorariosDisponiveis(medico.id, dataStr);
        
        // Se não houver horários da API, usar horários padrão
        const horariosDisponiveis = horarios.length > 0 ? horarios : [
          '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
        ];
        
        horariosData.push({
          data: dataStr,
          horarios: horariosDisponiveis
        });
      }
      
      setHorariosDisponiveis(horariosData);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setErro('Erro ao carregar horários disponíveis');
    } finally {
      setCarregando(false);
    }
  };

  // Função para selecionar data
  const handleSelecionarData = (data: string) => {
    setDataSelecionada(data);
    setHorarioSelecionado(''); // Limpar horário selecionado
  };

  // Função para confirmar agendamento
  const handleAgendar = async () => {
    if (!medicoSelecionado || !dataSelecionada || !horarioSelecionado) {
      setErro('Por favor, selecione um médico, data e horário');
      return;
    }

    setCarregandoAgendamento(true);
    setErro('');
    setSucesso('');
    
    await agendarConsulta(medicoSelecionado.id, dataSelecionada, horarioSelecionado, medicoSelecionado.especialidade);
    
    setCarregandoAgendamento(false);
  };



  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

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
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/dashboard-paciente"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Agendar Consulta</h1>
            </div>
            <div className="text-sm text-gray-600">
              Olá, {user.nome}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {erro && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{erro}</p>
          </div>
        )}
        
        {sucesso && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{sucesso}</p>
          </div>
        )}

        {!medicoSelecionado ? (
          /* Lista de Médicos */
          <div>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Encontre seu médico</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Search className="h-4 w-4 inline mr-1" />
                    Buscar por nome ou especialidade
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
                    Filtrar por especialidade
                  </label>
                  <select
                    value={especialidadeFiltro}
                    onChange={(e) => setEspecialidadeFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas as especialidades</option>
                    {especialidades.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Médicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carregando ? (
                <div className="col-span-full text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Carregando médicos...</p>
                </div>
              ) : medicosDisponiveis.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">Nenhum médico encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                medicosDisponiveis.map(medico => (
                  <div key={medico.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <img
                        src={medico.foto}
                        alt={medico.nome}
                        className="h-16 w-16 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{medico.nome}</h3>
                        <p className="text-blue-600 font-medium">{medico.especialidade}</p>
                        <p className="text-sm text-gray-500">{medico.crm}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center mr-2">
                        {renderStars(medico.avaliacaoMedia)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {medico.avaliacaoMedia} ({medico.totalAvaliacoes} avaliações)
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-lg font-semibold text-green-600">
                        R$ {medico.valorConsulta.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">por consulta</p>
                    </div>
                    
                    <button
                      onClick={() => handleSelecionarMedico(medico)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Selecionar Médico
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Seleção de Horário */
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Selecionar Horário</h2>
                <button
                  onClick={() => setMedicoSelecionado(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Trocar médico
                </button>
              </div>
              
              {/* Médico Selecionado */}
              <div className="flex items-center mb-6 p-4 bg-blue-50 rounded-lg">
                <img
                  src={medicoSelecionado.foto}
                  alt={medicoSelecionado.nome}
                  className="h-16 w-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{medicoSelecionado.nome}</h3>
                  <p className="text-blue-600 font-medium">{medicoSelecionado.especialidade}</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {medicoSelecionado.valorConsulta.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Seleção de Data e Horário */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Datas Disponíveis */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    <Calendar className="h-5 w-5 inline mr-2" />
                    Selecione a Data
                  </h3>
                  <div className="space-y-2">
                    {horariosDisponiveis.map(item => (
                      <button
                        key={item.data}
                        onClick={() => handleSelecionarData(item.data)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          dataSelecionada === item.data
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{formatarData(item.data)}</div>
                        <div className="text-sm text-gray-500">
                          {item.horarios.length} horários disponíveis
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Horários Disponíveis */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    <Clock className="h-5 w-5 inline mr-2" />
                    Selecione o Horário
                  </h3>
                  {dataSelecionada ? (
                    carregandoHorarios ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Carregando horários...</span>
                      </div>
                    ) : horariosDisponiveis
                        .find(item => item.data === dataSelecionada)
                        ?.horarios.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {horariosDisponiveis
                          .find(item => item.data === dataSelecionada)
                          ?.horarios.map(horario => (
                            <button
                              key={horario}
                              onClick={() => setHorarioSelecionado(horario)}
                              className={`p-3 rounded-lg border text-center transition-colors ${
                                horarioSelecionado === horario
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {horario}
                            </button>
                          ))
                        }
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum horário disponível para esta data
                      </p>
                    )
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Selecione uma data para ver os horários disponíveis
                    </p>
                  )}
                </div>
              </div>
              
              {/* Resumo e Confirmação */}
              {dataSelecionada && horarioSelecionado && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Resumo da Consulta</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Médico:</span>
                      <span className="font-medium">{medicoSelecionado.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Especialidade:</span>
                      <span className="font-medium">{medicoSelecionado.especialidade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium">{formatarData(dataSelecionada)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horário:</span>
                      <span className="font-medium">{horarioSelecionado}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-semibold text-green-600">
                        R$ {medicoSelecionado.valorConsulta.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAgendar}
                    disabled={carregandoAgendamento}
                    className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {carregandoAgendamento ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Agendando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}