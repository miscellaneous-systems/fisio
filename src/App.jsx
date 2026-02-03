// src/App.jsx (VERSÃO CORRIGIDA E REORGANIZADA)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout'; 

// Importe suas páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard'; 
import PacientesPage from './pages/PacientesPage';
import AgendamentosPage from './pages/AgendamentosPage';
import PacotesPage from './pages/PacotesPage'; 
import ProntuarioPage from './pages/ProntuarioPage'; 
import DetalheAgendamentoPage from './pages/DetalheAgendamentoPage'; 
import TabelaAgendamento from './components/TabelaAgendamento';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
// 💡 1. IMPORTAÇÃO DA NOVA PÁGINA
import PilatesPage from './pages/PilatesPage'; 
import RelatoriosPage from './pages/RelatoriosPage';
import './index.css'; // 1. Base, Reset, Fonte (Poppins) e Estilos de Utilidade Global (Modais)
import './App.css';   // 2. Regras de Layout do #root
// ...


// Componente para proteger rotas privadas (sem mudanças)
const PrivateRoute = ({ children }) => {
    const { signed } = useAuth();
    return signed ? children : <Navigate to="/login" />; 
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rota Pública */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/redefinir-senha" element={<ResetPasswordPage />} />



                {/* Rotas Privadas: Usando Layout como rota PARENTE */}
                <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                    
                    {/* 1. Rotas de Conteúdo Principal */}
                    <Route path="/" element={<Dashboard />} /> 
                    
                    {/* 2. Rotas de Pacientes */}
                    <Route path="/pacientes" element={<PacientesPage />} />
                    <Route path="/pacientes/:pacienteId" element={<ProntuarioPage />} />
                    
                    {/* 3. Rotas de Agendamentos (Agrupadas) */}
                    <Route path="/agendamentos" element={<Navigate to="/agenda/semanal" replace />} />
                    <Route path="/agenda/semanal" element={<TabelaAgendamento />} />
                    <Route path="/agenda/sessoes" element={<AgendamentosPage />} />
                    <Route path="/agendamentos/:agendamentoId" element={<DetalheAgendamentoPage />} />
                    
                    {/* 4. ROTA DE Pacotes */}
                    <Route path="/pacotes" element={<PacotesPage />} /> 

                    {/* 💡 5. NOVA ROTA PARA PILATES */}
                    {/* Esta rota usa o componente PilatesPage para listar os clientes de Pilates */}
                    <Route path="/pilates" element={<PilatesPage />} /> 

                    <Route path="/relatorios" element={<RelatoriosPage />} />

                </Route>
                
                {/* Rota de fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;