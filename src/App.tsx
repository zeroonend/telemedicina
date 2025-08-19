import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import DashboardPaciente from '@/pages/DashboardPaciente';
import DashboardMedico from '@/pages/DashboardMedico';
import AgendarConsulta from '@/pages/AgendarConsulta';
import MinhasConsultas from '@/pages/MinhasConsultas';
import VideoConsulta from '@/pages/VideoConsulta';
import ConsultaPresencial from '@/pages/ConsultaPresencial';
import Prescricoes from '@/pages/Prescricoes';
import Pagamentos from '@/pages/Pagamentos';
import HistoricoMedico from '@/pages/HistoricoMedico';

// Componente para proteger rotas autenticadas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.tipo)) {
    const dashboardPath = user.tipo === 'medico' ? '/dashboard-medico' : '/dashboard-paciente';
    return <Navigate to={dashboardPath} replace />;
  }
  
  return <>{children}</>;
}

// Componente para redirecionar usuários autenticados
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated && user) {
    const dashboardPath = user.tipo === 'medico' ? '/dashboard-medico' : '/dashboard-paciente';
    return <Navigate to={dashboardPath} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/cadastro" element={
          <PublicRoute>
            <Cadastro />
          </PublicRoute>
        } />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard-paciente" element={
          <ProtectedRoute>
            <DashboardPaciente />
          </ProtectedRoute>
        } />
        <Route path="/dashboard-medico" element={
          <ProtectedRoute>
            <DashboardMedico />
          </ProtectedRoute>
        } />
        <Route path="/agendar-consulta" element={
          <ProtectedRoute>
            <AgendarConsulta />
          </ProtectedRoute>
        } />
        <Route path="/agenda-consulta" element={
          <ProtectedRoute allowedRoles={['paciente']}>
            <MinhasConsultas />
          </ProtectedRoute>
        } />
        <Route path="/video-consulta/:consultaId" element={
          <ProtectedRoute>
            <VideoConsulta />
          </ProtectedRoute>
        } />
        <Route path="/consulta-presencial/:consultaId" element={
          <ProtectedRoute allowedRoles={['medico']}>
            <ConsultaPresencial />
          </ProtectedRoute>
        } />
        <Route path="/prescricoes" element={
              <ProtectedRoute allowedRoles={['medico']}>
                <Prescricoes />
              </ProtectedRoute>
            } />
            <Route path="/nova-prescricao/:pacienteId" element={
              <ProtectedRoute allowedRoles={['medico']}>
                <Prescricoes />
              </ProtectedRoute>
            } />
            <Route path="/pagamentos" element={
              <ProtectedRoute allowedRoles={['paciente']}>
                <Pagamentos />
              </ProtectedRoute>
            } />
            <Route path="/historico-medico" element={
              <ProtectedRoute>
                <HistoricoMedico />
              </ProtectedRoute>
            } />
        
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
