// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api'; 
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale'; 

// 💡 Imports do Lucide
import { 
    Calendar, 
    UserPlus, 
    Hourglass, 
    Clock 
} from 'lucide-react';

import styles from './Dashboard.module.css';

const statusOptions = ['Todos', 'Pendente', 'Realizado', 'Cancelado'];

// 💡 StatCard corrigido para renderizar o ícone como tag JSX (<Icon />)
const StatCard = ({ icon: Icon, value, label, subLabel }) => (
    <div className={styles.statCard}>
        <div className={styles.statIcon}>
            {Icon && <Icon size={26} strokeWidth={2} />}
        </div>
        <div className={styles.statValue}>{value}</div>
        {subLabel && <div className={styles.statSubLabel}>{subLabel}</div>}
        <div className={styles.statLabel}>{label}</div>
    </div>
);

const Dashboard = () => {
    const { signOut } = useAuth();

    const [dashboardData, setDashboardData] = useState({
        agendamentosHoje: 0,
        novosPacientesMes: 0,
        sessoesPendentes: 0,
        proximoPaciente: null 
    });
    const [agendamentosSemana, setAgendamentosSemana] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('Pendente'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatarHora = (dataHora) => {
        if (!dataHora) return '';
        const date = parseISO(dataHora);
        if (!isValid(date)) return 'Data inválida';
        return format(date, 'EEE, dd/MM - HH:mm', { locale: ptBR }); 
    };

    const getStatusClassName = (status) => {
        switch (status) {
            case 'Pendente': return styles.statusPendente;
            case 'Realizado': return styles.statusRealizado;
            case 'Cancelado': return styles.statusCancelado;
            default: return styles.statusDefault;
        }
    };
    
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
            const statusFiltro = selectedStatus === 'Todos' ? '' : selectedStatus;
            const hoje = new Date();
            const diaDaSemana = hoje.getDay(); 
            const diffInicio = hoje.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1); 
            
            const inicioSemana = new Date(hoje.setDate(diffInicio));
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(inicioSemana.getDate() + 6);
            const inicioFormatado = format(inicioSemana, 'yyyy-MM-dd');
            const fimFormatado = format(fimSemana, 'yyyy-MM-dd');
            
            const response = await api.get(`/agendamentos?dataInicio=${inicioFormatado}&dataFim=${fimFormatado}&status=${statusFiltro}`);
            setAgendamentosSemana(response.data.agendamentos);
        } catch (err) {
            console.error("Falha ao carregar a Agenda Semanal:", err);
            if (err.response?.status === 403) {
                signOut();
                return;
            }
            if (!error) setError("Falha ao carregar a Agenda Semanal.");
        }
    }, [selectedStatus, error, signOut]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchDashboardData(), fetchAgendaSemanal()])
            .finally(() => setLoading(false));
    }, [fetchDashboardData, fetchAgendaSemanal]); 

    useEffect(() => {
        if (!loading) {
            fetchAgendaSemanal();
        }
    }, [selectedStatus, loading, fetchAgendaSemanal]);

    const stats = [
        { label: "Agendamentos Hoje", value: dashboardData.agendamentosHoje, icon: Calendar },
        { label: "Novos Pacientes (Mês)", value: dashboardData.novosPacientesMes, icon: UserPlus },
        { label: "Sessões Pendentes", value: dashboardData.sessoesPendentes, icon: Hourglass },
        { 
            label: "Próximo Paciente", 
            value: dashboardData.proximoPaciente ? dashboardData.proximoPaciente.nome : 'N/A', 
            subLabel: dashboardData.proximoPaciente ? formatarHora(dashboardData.proximoPaciente.hora) : '', 
            icon: Clock 
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