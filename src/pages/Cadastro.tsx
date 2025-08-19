import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type UserType = 'paciente' | 'medico';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  // Campos específicos para médico
  crm?: string;
  especialidade?: string;
  // Campos específicos para paciente
  endereco?: string;
}

const especialidades = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
  'Clínica Geral'
];

export default function Cadastro() {
  const [userType, setUserType] = useState<UserType>('paciente');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    crm: '',
    especialidade: '',
    endereco: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Limpar erro quando componente for desmontado
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações básicas
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.senha) newErrors.senha = 'Senha é obrigatória';
    if (formData.senha.length < 6) newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = 'Senhas não coincidem';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória';

    // Validações específicas para médico
    if (userType === 'medico') {
      if (!formData.crm?.trim()) newErrors.crm = 'CRM é obrigatório';
      if (!formData.especialidade?.trim()) newErrors.especialidade = 'Especialidade é obrigatória';
    }

    // Validações específicas para paciente
    if (userType === 'paciente') {
      if (!formData.endereco?.trim()) newErrors.endereco = 'Endereço é obrigatório';
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const registerData = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        dataNascimento: formData.dataNascimento,
        tipo: userType,
        ...(userType === 'medico' && {
          crm: formData.crm,
          especialidade: formData.especialidade
        }),
        ...(userType === 'paciente' && {
          endereco: formData.endereco
        })
      };

      await register(registerData);
    } catch (error) {
      console.error('Erro no cadastro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Preencha os dados para criar sua conta
          </p>
        </div>

        {/* Seletor de tipo de usuário */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Conta</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('paciente')}
              className={cn(
                "p-4 border-2 rounded-lg text-center transition-all duration-200",
                userType === 'paciente'
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <User className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Paciente</div>
              <div className="text-sm text-gray-500">Agendar consultas</div>
            </button>
            <button
              type="button"
              onClick={() => setUserType('medico')}
              className={cn(
                "p-4 border-2 rounded-lg text-center transition-all duration-200",
                userType === 'medico'
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Médico</div>
              <div className="text-sm text-gray-500">Atender pacientes</div>
            </button>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erro geral */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Dados básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.nome
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="Seu nome completo"
                    disabled={isLoading}
                  />
                </div>
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.senha
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha}</p>}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    className={cn(
                      "block w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.confirmarSenha
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="Confirme sua senha"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmarSenha && <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.telefone
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="(11) 99999-9999"
                    disabled={isLoading}
                  />
                </div>
                {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.cpf
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={isLoading}
                  />
                </div>
                {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
              </div>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                    errors.dataNascimento
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.dataNascimento && <p className="mt-1 text-sm text-red-600">{errors.dataNascimento}</p>}
            </div>

            {/* Campos específicos para médico */}
            {userType === 'medico' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CRM *
                  </label>
                  <input
                    type="text"
                    value={formData.crm || ''}
                    onChange={(e) => handleInputChange('crm', e.target.value)}
                    className={cn(
                      "block w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.crm
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    placeholder="Ex: CRM/SP 123456"
                    disabled={isLoading}
                  />
                  {errors.crm && <p className="mt-1 text-sm text-red-600">{errors.crm}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidade *
                  </label>
                  <select
                    value={formData.especialidade || ''}
                    onChange={(e) => handleInputChange('especialidade', e.target.value)}
                    className={cn(
                      "block w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                      errors.especialidade
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    disabled={isLoading}
                  >
                    <option value="">Selecione uma especialidade</option>
                    {especialidades.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                  {errors.especialidade && <p className="mt-1 text-sm text-red-600">{errors.especialidade}</p>}
                </div>
              </div>
            )}

            {/* Campo específico para paciente */}
            {userType === 'paciente' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço *
                </label>
                <input
                  type="text"
                  value={formData.endereco || ''}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className={cn(
                    "block w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-1",
                    errors.endereco
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  )}
                  placeholder="Rua, número, bairro, cidade - UF"
                  disabled={isLoading}
                />
                {errors.endereco && <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>}
              </div>
            )}

            {/* Botão de cadastro */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200",
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Criar Conta
                  </>
                )}
              </button>
            </div>

            {/* Link para login */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}