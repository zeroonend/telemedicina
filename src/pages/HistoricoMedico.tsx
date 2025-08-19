import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Pill, Stethoscope, Clock, User, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface HistoricoItem {
  id: string;
  paciente_id: string;
  consulta_id?: string;
  diagnostico?: string;
  tratamento?: string;
  exames?: string;
  observacoes?: string;
  medicamentos: any[];
  arquivos_anexos: string[];
  criado_em: string;
  atualizado_em?: string;
}

interface Paciente {
  id: string;
  nome: string;
  email: string;
}

const HistoricoMedico: React.FC = () => {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoricoItem | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    diagnostico: '',
    tratamento: '',
    exames: '',
    observacoes: '',
    medicamentos: [] as any[]
  });

  const userType = localStorage.getItem('userType');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchHistorico();
    if (userType === 'medico') {
      fetchPacientes();
    }
  }, [selectedPaciente]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3002/api/historico-medico';
      
      if (userType === 'paciente') {
        url += `/${userId}`;
      } else if (selectedPaciente) {
        url += `/${selectedPaciente}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorico(data.historico || data);
      } else {
        toast.error('Erro ao carregar histórico médico');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico médico');
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/auth/usuarios?tipo=paciente', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.usuarios || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `http://localhost:3002/api/historico-medico/${editingItem.id}`
        : 'http://localhost:3002/api/historico-medico';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingItem ? 'Histórico atualizado com sucesso!' : 'Histórico criado com sucesso!');
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchHistorico();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar histórico');
      }
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      toast.error('Erro ao salvar histórico');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/historico-medico/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Registro excluído com sucesso!');
        fetchHistorico();
      } else {
        toast.error('Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      diagnostico: '',
      tratamento: '',
      exames: '',
      observacoes: '',
      medicamentos: []
    });
  };

  const openEditModal = (item: HistoricoItem) => {
    setEditingItem(item);
    setFormData({
      paciente_id: item.paciente_id,
      diagnostico: item.diagnostico || '',
      tratamento: item.tratamento || '',
      exames: item.exames || '',
      observacoes: item.observacoes || '',
      medicamentos: item.medicamentos || []
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const filteredHistorico = historico.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.diagnostico?.toLowerCase().includes(searchLower) ||
      item.tratamento?.toLowerCase().includes(searchLower) ||
      item.observacoes?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico médico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Histórico Médico
              </h1>
              <p className="text-gray-600 mt-2">
                {userType === 'paciente' ? 'Seu prontuário eletrônico' : 'Gerenciar histórico dos pacientes'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Voltar
              </button>
              
              {userType === 'medico' && (
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Novo Registro
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar no histórico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {userType === 'medico' && (
              <select
                value={selectedPaciente}
                onChange={(e) => setSelectedPaciente(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os pacientes</option>
                {pacientes.map(paciente => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista do Histórico */}
        <div className="space-y-4">
          {filteredHistorico.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
              <p className="text-gray-500">
                {userType === 'paciente' 
                  ? 'Você ainda não possui registros no seu histórico médico.'
                  : 'Nenhum registro encontrado para os filtros selecionados.'}
              </p>
            </div>
          ) : (
            filteredHistorico.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="text-blue-600" size={20} />
                    <span className="text-sm text-gray-500">
                      {formatDate(item.criado_em)}
                    </span>
                    {item.atualizado_em && item.atualizado_em !== item.criado_em && (
                      <span className="text-xs text-gray-400">
                        (Atualizado em {formatDate(item.atualizado_em)})
                      </span>
                    )}
                  </div>
                  
                  {userType === 'medico' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {item.diagnostico && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Diagnóstico</h4>
                      <p className="text-gray-600">{item.diagnostico}</p>
                    </div>
                  )}
                  
                  {item.tratamento && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Tratamento</h4>
                      <p className="text-gray-600">{item.tratamento}</p>
                    </div>
                  )}
                  
                  {item.exames && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Exames</h4>
                      <p className="text-gray-600">{item.exames}</p>
                    </div>
                  )}
                  
                  {item.observacoes && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Observações</h4>
                      <p className="text-gray-600">{item.observacoes}</p>
                    </div>
                  )}
                </div>

                {item.medicamentos && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Pill size={16} />
                      Medicamentos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(typeof item.medicamentos === 'string' ? JSON.parse(item.medicamentos) : item.medicamentos).map((med: any, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {typeof med === 'string' ? med : med.nome || 'Medicamento'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para Criar/Editar */}
      {showModal && userType === 'medico' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingItem ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paciente *
                    </label>
                    <select
                      value={formData.paciente_id}
                      onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um paciente</option>
                      {pacientes.map(paciente => (
                        <option key={paciente.id} value={paciente.id}>
                          {paciente.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o diagnóstico..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamento
                  </label>
                  <textarea
                    value={formData.tratamento}
                    onChange={(e) => setFormData({...formData, tratamento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o tratamento..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exames
                  </label>
                  <textarea
                    value={formData.exames}
                    onChange={(e) => setFormData({...formData, exames: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Resultados de exames e laudos..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Observações gerais..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoMedico;