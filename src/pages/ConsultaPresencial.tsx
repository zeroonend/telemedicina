import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, FileText, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Consulta {
  id: string;
  paciente_id: string;
  medico_id: string;
  data_hora: string;
  status: string;
  especialidade: string;
  observacoes?: string;
  valor: number;
  nome_paciente?: string;
  nome_medico?: string;
}

function ConsultaPresencial() {
  const { consultaId } = useParams<{ consultaId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (consultaId) {
      buscarConsulta();
    }
  }, [consultaId]);

  const buscarConsulta = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/consultas/${consultaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // O backend retorna os dados dentro de data.consulta
        const consultaData = data.consulta;
        
        // Mapear os dados para o formato esperado pelo frontend
        const consultaFormatada = {
          id: consultaData.id,
          paciente_id: consultaData.paciente.id,
          medico_id: consultaData.medico.id,
          data_hora: consultaData.data_hora,
          status: consultaData.status,
          especialidade: consultaData.especialidade,
          observacoes: consultaData.observacoes,
          valor: consultaData.valor,
          nome_paciente: consultaData.paciente.nome,
          nome_medico: consultaData.medico.nome
        };
        
        setConsulta(consultaFormatada);
        setObservacoes(consultaFormatada.observacoes || '');
      } else {
        console.error('Erro ao buscar consulta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar consulta:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarObservacoes = async () => {
    setSalvando(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/consultas/${consultaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacoes })
      });
      
      if (response.ok) {
        alert('Observações salvas com sucesso!');
      } else {
        alert('Erro ao salvar observações');
      }
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      alert('Erro ao salvar observações');
    } finally {
      setSalvando(false);
    }
  };

  const finalizarConsulta = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/consultas/${consultaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'finalizada', observacoes })
      });
      
      if (response.ok) {
        alert('Consulta finalizada com sucesso!');
        navigate('/dashboard-medico');
      } else {
        alert('Erro ao finalizar consulta');
      }
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error);
      alert('Erro ao finalizar consulta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Consulta não encontrada</h2>
          <button
            onClick={() => navigate('/dashboard-medico')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
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
              <button
                onClick={() => navigate('/dashboard-medico')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar ao Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Consulta Presencial</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {consulta.nome_paciente || 'Paciente'}
              </h2>
              <p className="text-gray-600">{consulta.especialidade}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Data e Hora</p>
                <p className="font-medium">
                  {new Date(consulta.data_hora).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {consulta.status === 'em_andamento' ? 'Em Andamento' : consulta.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações da Consulta</h3>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Digite suas observações sobre a consulta..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex justify-between mt-6">
            <button
              onClick={salvarObservacoes}
              disabled={salvando}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar Observações'}
            </button>
            
            <button
              onClick={finalizarConsulta}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Finalizar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsultaPresencial;