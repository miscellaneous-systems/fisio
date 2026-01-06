// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api'; 

import { useAuth } from '../contexts/AuthContext';
// 💡 Imports do date-fns
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale'; 

// 💡 Importa estilos modulares
import styles from './Dashboard.module.css';

// 1. OPÇÕES DE STATUS PARA O FILTRO
const statusOptions = ['Todos', 'Pendente', 'Realizado', 'Cancelado'];

// 💡 COMPONENTE EXTRAÍDO E UTILIZADO (Melhoria de Reutilização)
const StatCard = ({ icon, value, label, subLabel }) => (
    <div className={styles.statCard}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statValue}>{value}</div>
        {subLabel && <div className={styles.statSubLabel}>{subLabel}</div>}
        <div className={styles.statLabel}>{label}</div>
    </div>
);


const Dashboard = () => {
    const { signOut } = useAuth();

    // Estado (Mantido)
    const [dashboardData, setDashboardData] = useState({
        agendamentosHoje: 0,
        novosPacientesMes: 0,
        sessoesPendentes: 0,
        proximoPaciente: null 
    });
    const [agendamentosSemana, setAgendamentosSemana] = useState([]);

    // ESTADO DO FILTRO (Mantido)
    const [selectedStatus, setSelectedStatus] = useState('Pendente'); 

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para formatar DATA E HORA (Mantida)
    const formatarHora = (dataHora) => {
        if (!dataHora) return '';
        const date = parseISO(dataHora);
        if (!isValid(date)) return 'Data inválida';
        
        return format(date, 'EEE, dd/MM - HH:mm', { locale: ptBR }); 
    };

    // 💡 FUNÇÃO AUXILIAR PARA MAPEAR O STATUS PARA A CLASSE CSS
    const getStatusClassName = (status) => {
        switch (status) {
            case 'Pendente':
                return styles.statusPendente;
            case 'Realizado':
                return styles.statusRealizado;
            case 'Cancelado':
                return styles.statusCancelado;
            case 'Todos': // Necessário para evitar que "Todos" caia no default
                return styles.statusDefault; 
            default:
                return styles.statusDefault;
        }
    };
    
    // Funções de busca (usando useCallback para estabilizar as dependências)
    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard'); 
            setDashboardData(response.data.data);
        } catch (err) {
            console.error("Erro ao carregar dados do Dashboard:", err);
            if (err.response?.status === 403) {
                signOut();
                return;
            }
            setError("Falha ao carregar os dados dos cartões.");
        }
    }, [signOut]);

    const fetchAgendaSemanal = useCallback(async () => {
        try {
            // Mapeamento de 'Todos' para remover o parâmetro de status, se necessário
            const statusFiltro = selectedStatus === 'Todos' ? '' : selectedStatus;
            
            // 💡 CORREÇÃO: Lógica de cálculo de data segura contra fuso horário.
            const hoje = new Date();
            const diaDaSemana = hoje.getDay(); // Domingo = 0, Segunda = 1, ...
            const diffInicio = hoje.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1); // Ajusta para segunda-feira
            
            const inicioSemana = new Date(hoje.setDate(diffInicio));
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(inicioSemana.getDate() + 6);
            const inicioFormatado = format(inicioSemana, 'yyyy-MM-dd');
            const fimFormatado = format(fimSemana, 'yyyy-MM-dd');
            
            // 💡 Incluindo status na query
            const response = await api.get(`/agendamentos?dataInicio=${inicioFormatado}&dataFim=${fimFormatado}&status=${statusFiltro}`);
            setAgendamentosSemana(response.data.agendamentos);
            
        } catch (err) {
            console.error("Falha ao carregar a Agenda Semanal:", err);
            if (err.response?.status === 403) {
                signOut();
                return;
            }
            // Não sobrescrever o erro principal do dashboard, se já existir
            if (!error) setError("Falha ao carregar a Agenda Semanal.");
        }
    }, [selectedStatus, error, signOut]); // Depende do filtro de status

    // 💡 OTIMIZAÇÃO: Efeitos separados para buscar dados.

    // 1. Efeito para buscar todos os dados na montagem inicial
    useEffect(() => {
        setLoading(true);
        // Usa as funções de busca estabilizadas pelo useCallback
        Promise.all([fetchDashboardData(), fetchAgendaSemanal()])
            .finally(() => setLoading(false));
    }, [fetchDashboardData, fetchAgendaSemanal]); 
    // fetchDashboardData e fetchAgendaSemanal (com o filtro inicial) estão agora nas dependências

    // 2. Efeito para rebuscar a agenda semanal sempre que o filtro de status muda (Após a carga inicial)
    useEffect(() => {
        if (!loading) {
            // Se o selectedStatus muda, o fetchAgendaSemanal é recalculado (por causa do useCallback) e re-executado aqui.
            fetchAgendaSemanal();
        }
    }, [selectedStatus, loading, fetchAgendaSemanal]); // fetchAgendaSemanal é a dependência

    // Estrutura de exibição dos cartões (Mantida)
    const stats = [
        { 
            label: "Agendamentos Hoje", 
            value: dashboardData.agendamentosHoje, 
            icon: "📅" 
        },
        { 
            label: "Novos Pacientes (Mês)", 
            value: dashboardData.novosPacientesMes, 
            icon: "➕" 
        },
        { 
            label: "Sessões Pendentes", 
            value: dashboardData.sessoesPendentes, 
            icon: "⏳" 
        },
        { 
            label: "Próximo Paciente", 
            value: dashboardData.proximoPaciente ? dashboardData.proximoPaciente.nome : 'N/A', 
            subLabel: dashboardData.proximoPaciente ? formatarHora(dashboardData.proximoPaciente.hora) : '', 
            icon: "🕒" 
        },
    ];

    if (loading) {
        return <div className={styles.centeredMessage} role="status">Carregando dados do Painel...</div>;
    }

    if (error) {
        return <div className={`${styles.centeredMessage} ${styles.errorMsg}`} role="alert">{error}</div>;
    }

    return (
        <div className={styles.pageContainer}> 
            <h1>Bem-vindo ao Painel de Controle!</h1>
            <p className={styles.subtitle}>Visão geral da sua clínica.</p>

            <div className={styles.statsGrid}> 
                {stats.map((stat, index) => (
                    <StatCard 
                        key={index} 
                        icon={stat.icon} 
                        value={stat.value} 
                        label={stat.label} 
                        subLabel={stat.subLabel}
                    />
                ))}
            </div>
            
            <section className={styles.calendarSection}> 
                
                <div className={styles.agendaHeader}>
                    <h2>Agenda Semanal</h2>
                    
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={styles.statusSelect}
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.agendaList}> 
                    {agendamentosSemana.length === 0 ? (
                        <div className={styles.placeholder}>Nenhum agendamento encontrado para esta semana com o status "{selectedStatus}".</div> 
                    ) : (
                        agendamentosSemana.map(agendamento => {
                            const data = parseISO(agendamento.data_hora);
                            return (
                                <div key={agendamento.id} className={styles.agendaItem}> 
                                    <span className={styles.agendaTime}> 
                                        {isValid(data) 
                                            ? format(data, 'EEE, dd/MM - HH:mm', { locale: ptBR })
                                            : 'Data inválida'
                                        }
                                    </span>
                                    <span> {agendamento.nome_paciente} - ({agendamento.servico_tipo})</span>
                                    <span className={getStatusClassName(agendamento.status)}>{agendamento.status}</span>
                                </div>
                            );
                        })
                    )}

                </div>
            </section>

        </div>
    );
};

export default Dashboard;