import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, MessageCircle, Settings, Users, Clock, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DailyIframe from '@daily-co/daily-js';
// import { toast } from 'sonner'; // Removido temporariamente

interface Consulta {
  id: string;
  paciente: {
    id: string;
    nome: string;
    foto?: string;
  };
  medico: {
    id: string;
    nome: string;
    especialidade: string;
    foto?: string;
  };
  dataHora: string;
  status: string;
  valor: number;
}

interface ChatMessage {
  id: string;
  usuario: string;
  mensagem: string;
  timestamp: string;
  tipo: 'paciente' | 'medico';
}

export default function VideoConsulta() {
  const { consultaId } = useParams<{ consultaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Estados da consulta
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>('');
  
  // Estados do vídeo
  const [micLigado, setMicLigado] = useState(true);
  const [videoLigado, setVideoLigado] = useState(true);
  const [chamadaAtiva, setChamadaAtiva] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [tempoConsulta, setTempoConsulta] = useState(0);
  
  // Estados do chat
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  
  // Refs para Daily.co
  const callFrameRef = useRef<any>(null);
  const videoLocalRef = useRef<HTMLDivElement>(null);
  const videoRemotoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configuração do Daily.co
  const DAILY_ROOM_URL = `https://your-domain.daily.co/consulta_${consultaId}`; // Em produção, obter do backend

  useEffect(() => {
    if (consultaId) {
      carregarConsulta();
    }
  }, [consultaId]);

  useEffect(() => {
    return () => {
      // Cleanup ao sair da página
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

  const carregarConsulta = async () => {
    try {
      setCarregando(true);
      
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const consultaData: Consulta = {
        id: consultaId!,
        paciente: {
          id: '1',
          nome: 'Ana Silva',
          foto: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20patient%20smiling%20healthcare&image_size=square'
        },
        medico: {
          id: '2',
          nome: 'Dr. João Santos',
          especialidade: 'Cardiologia',
          foto: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20man%20white%20coat%20smiling%20cardiology&image_size=square'
        },
        dataHora: new Date().toISOString(),
        status: 'agendada',
        valor: 150.00
      };
      
      setConsulta(consultaData);
      
      // Inicializar mensagens do chat
      const mensagensIniciais: ChatMessage[] = [
        {
          id: '1',
          usuario: consultaData.medico.nome,
          mensagem: 'Olá! Bem-vindo(a) à consulta. Como posso ajudá-lo(a) hoje?',
          timestamp: new Date().toISOString(),
          tipo: 'medico'
        }
      ];
      setMensagens(mensagensIniciais);
      
      // Inicializar Daily.co
      await inicializarDaily();
      
    } catch (error) {
      setErro('Erro ao carregar dados da consulta');
      console.error('Erro ao carregar consulta');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para inicializar Daily.co
  const inicializarDaily = async () => {
    try {
      const callFrame = DailyIframe.createFrame({
        showLeaveButton: false,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '0',
        },
      });
      callFrameRef.current = callFrame;
      
      callFrame.on('joined-meeting', () => {
        setConectado(true);
      });
      
      callFrame.on('left-meeting', () => {
        setConectado(false);
      });
      
      // Adicionar o frame ao DOM
      const container = document.getElementById('video-remoto');
      if (container) {
        container.appendChild(callFrame.iframe());
      }
    } catch (error) {
      console.error('Erro ao inicializar Daily:', error);
    }
  };

  // Função para iniciar a chamada
  const iniciarChamada = async () => {
    try {
      if (!callFrameRef.current) {
        throw new Error('Call frame não inicializado');
      }
      
      await callFrameRef.current.join({ url: DAILY_ROOM_URL });
      
      setChamadaAtiva(true);
      setConectado(true);
      
      // Iniciar timer da consulta
      timerRef.current = setInterval(() => {
        setTempoConsulta(prev => prev + 1);
      }, 1000);
      
      console.log('Chamada iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
    }
  };

  // Função para encerrar a chamada
  const encerrarChamada = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (callFrameRef.current) {
        await callFrameRef.current.leave();
      }
      
      setTempoConsulta(0);
      setChamadaAtiva(false);
      setConectado(false);
      
      console.log('Chamada encerrada');
      
      navigate(user?.tipo === 'medico' ? '/dashboard-medico' : '/dashboard-paciente');
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    }
  };

  // Função para alternar microfone
  const alternarMicrofone = async () => {
    try {
      if (callFrameRef.current) {
        const current = callFrameRef.current.participants().local;
        callFrameRef.current.updateParticipant('local', {
          setAudio: !current.audio
        });
        setMicLigado(!micLigado);
      }
    } catch (error) {
      console.error('Erro ao alternar microfone:', error);
    }
  };

  // Função para alternar vídeo
  const alternarVideo = async () => {
    try {
      if (callFrameRef.current) {
        const current = callFrameRef.current.participants().local;
        callFrameRef.current.updateParticipant('local', {
          setVideo: !current.video
        });
        setVideoLigado(!videoLigado);
      }
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error);
    }
  };

  const enviarMensagem = () => {
    if (novaMensagem.trim() && user) {
      const mensagem: ChatMessage = {
        id: Date.now().toString(),
        usuario: user.nome,
        mensagem: novaMensagem.trim(),
        timestamp: new Date().toISOString(),
        tipo: user.tipo as 'paciente' | 'medico'
      };
      
      setMensagens(prev => [...prev, mensagem]);
      setNovaMensagem('');
    }
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="mb-4">Você precisa estar logado para acessar a consulta.</p>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p>Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Erro</h2>
          <p className="mb-4">{erro}</p>
          <button
            onClick={() => navigate(user.tipo === 'medico' ? '/dashboard-medico' : '/dashboard-paciente')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Consulta não encontrada</h2>
          <button
            onClick={() => navigate(user.tipo === 'medico' ? '/dashboard-medico' : '/dashboard-paciente')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header da Consulta */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">
                {user.tipo === 'medico' ? consulta.paciente.nome : consulta.medico.nome}
              </span>
            </div>
            {user.tipo === 'paciente' && (
              <span className="text-blue-400">{consulta.medico.especialidade}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {chamadaAtiva && (
              <div className="flex items-center space-x-2 text-green-400">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatarTempo(tempoConsulta)}</span>
              </div>
            )}
            
            <div className={`flex items-center space-x-1 ${
              conectado ? 'text-green-400' : 'text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                conectado ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm">
                {conectado ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex">
        {/* Área de Vídeo */}
        <div className="flex-1 relative">
          {!chamadaAtiva ? (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="mb-6">
                  <img
                    src={user.tipo === 'medico' ? consulta.paciente.foto : consulta.medico.foto}
                    alt={user.tipo === 'medico' ? consulta.paciente.nome : consulta.medico.nome}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h2 className="text-2xl font-bold mb-2">
                    {user.tipo === 'medico' ? consulta.paciente.nome : consulta.medico.nome}
                  </h2>
                  {user.tipo === 'paciente' && (
                    <p className="text-blue-400">{consulta.medico.especialidade}</p>
                  )}
                </div>
                
                <button
                  onClick={iniciarChamada}
                  className="bg-green-600 text-white px-8 py-3 rounded-full hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Phone className="h-5 w-5" />
                  <span>Iniciar Consulta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              {/* Tela de Chamada Ativa */}
              {/* Vídeo Remoto (Principal) */}
              <div
                id="video-remoto"
                className="w-full h-full object-cover bg-gray-800"
              ></div>
              
              {/* Vídeo Local (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                <div
                  id="video-local"
                  className="w-full h-full object-cover"
                ></div>
                {!videoLigado && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              
              {/* Controles de Vídeo */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-gray-800 bg-opacity-90 rounded-full px-6 py-3">
                  <button
                    onClick={alternarMicrofone}
                    className={`p-3 rounded-full transition-colors ${
                      micLigado ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
                    }`}
                  >
                    {micLigado ? (
                      <Mic className="h-5 w-5 text-white" />
                    ) : (
                      <MicOff className="h-5 w-5 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={alternarVideo}
                    className={`p-3 rounded-full transition-colors ${
                      videoLigado ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
                    }`}
                  >
                    {videoLigado ? (
                      <Video className="h-5 w-5 text-white" />
                    ) : (
                      <VideoOff className="h-5 w-5 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setChatAberto(!chatAberto)}
                    className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                  </button>
                  
                  <button
                    onClick={encerrarChamada}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                  >
                    <PhoneOff className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {chatAberto && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chat da Consulta</h3>
                <button
                  onClick={() => setChatAberto(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map(mensagem => (
                <div
                  key={mensagem.id}
                  className={`flex ${
                    mensagem.tipo === user.tipo ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      mensagem.tipo === user.tipo
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{mensagem.mensagem}</p>
                    <p className={`text-xs mt-1 ${
                      mensagem.tipo === user.tipo ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(mensagem.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}