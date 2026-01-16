import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

import styles from './AgendamentosPage.module.css';

const statusOptions = ['Todos', 'Pendente', 'Confirmado', 'Realizado', 'Cancelado'];
const servicoOptions = ['Fisioterapia', 'Pilates'];

// --- AUXILIARES ---
const formatarHora = (dataString) => {
    if (!dataString) return 'N/A';
    try {
        return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return 'Hora Inválida'; }
}

const formatarDataExibicao = (dataString) => {
    if (!dataString) return 'N/A';
    const datePart = dataString.split('T')[0];
    const [ano, mes, dia] = datePart.split('-');
    return `${dia}/${mes}/${ano}`;
}

const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayWithOffset = new Date(today.getTime() - (offset * 60 * 1000));
    return todayWithOffset.toISOString().split('T')[0];
}

const AgendamentosPage = () => {
    const navigate = useNavigate();

    // ESTADOS
    const [agendamentos, setAgendamentos] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState(getTodayString()); 
    const [statusFiltro, setStatusFiltro] = useState('Todos');
    const [servicoFiltro, setServicoFiltro] = useState('Todos'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lógica para o texto de exibição do filtro
    const dataDisplay = dataSelecionada 
        ? formatarDataExibicao(dataSelecionada) 
        : 'Todas as Datas (Histórico Completo)';

    const getStatusClassName = (status) => {
        switch (status) {
            case 'Realizado': return `${styles.statusBadge} ${styles.statusRealizado}`;
            case 'Confirmado': return `${styles.statusBadge} ${styles.statusConfirmado}`;
            case 'Cancelado': return `${styles.statusBadge} ${styles.statusCancelado}`;
            default: return `${styles.statusBadge} ${styles.statusPendente}`;
        }
    };
    
    // FETCH API
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                // Se for null, enviamos undefined ou string vazia dependendo do que sua API espera
                data: dataSelecionada || '', 
                status: statusFiltro === 'Todos' ? '' : statusFiltro, 
                servicoTipo: servicoFiltro === 'Todos' ? '' : servicoFiltro
            };

            const response = await api.get('/agendamentos/dia', { params });
            setAgendamentos(response.data.agendamentos || []);
        } catch (err) {
            console.error("Erro ao carregar agendamentos:", err);
            setError("Falha ao carregar a lista de agendamentos.");
            setAgendamentos([]);
        } finally {
            setLoading(false);
        }
    }, [dataSelecionada, statusFiltro, servicoFiltro]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    // HANDLERS
    const handleAddAgendamentoByService = (service) => navigate(`/agendamentos/novo?servico=${service}`);
    const handleDetalhes = (id) => navigate(`/agendamentos/${id}`);
    
    const handleConcluirSessao = async (id, nome) => {
        if (!window.confirm(`Deseja marcar a sessão de ${nome} como Realizada?`)) return;
        try {
            await api.put(`/agendamentos/${id}/concluir`);
            fetchAgendamentos(); 
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao concluir sessão.');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Agenda de Sessões</h1>
                <div className={styles.addControls}>
                    {servicoOptions.map(service => (
                        <button key={service} onClick={() => handleAddAgendamentoByService(service)} className={styles.addButtonService}>
                            + {service}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className={styles.controlsBar}>
                <div className={styles.filterGroup}>
                    <label>Data:</label>
                    <input 
                        type="date" 
                        // O value não pode ser null, então usamos fallback de string vazia
                        value={dataSelecionada || ""} 
                        onChange={(e) => setDataSelecionada(e.target.value)} 
                        className={styles.formInput} 
                    />
                    <div className={styles.dateActions}>
                        <button
                            type="button"
                            className={styles.clearBtn}
                            onClick={() => setDataSelecionada(getTodayString())}
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            className={styles.allBtn}
                            onClick={() => setDataSelecionada(null)}
                            // Desabilita se já estiver no modo "Ver Todos"
                            disabled={dataSelecionada === null}
                        >
                            Ver todos
                        </button>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label>Serviço:</label>
                    <select value={servicoFiltro} onChange={(e) => setServicoFiltro(e.target.value)} className={styles.formSelect}>
                        <option value="Todos">Todos</option>
                        {servicoOptions.map(service => <option key={service} value={service}>{service}</option>)}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Status:</label>
                    <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className={styles.formSelect}>
                        {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>
            
            <div className={styles.listInfo}>
                <p>Mostrando: <strong>{dataDisplay}</strong> | <strong>{servicoFiltro}</strong> | <strong>{statusFiltro}</strong></p>
            </div>

            {loading ? (
                <div className={styles.centeredMessage}>Carregando Agenda...</div>
            ) : agendamentos.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
                </div>
            ) : (
                <div className={styles.tableResponsive}>
                    <table className={styles.agendaTable}>
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Paciente</th>
                                <th>Tipo</th>
                                <th>Data</th> 
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agendamentos.map((agenda) => (
                                <tr key={agenda.id} className={styles.tableRow}>
                                    <td>{formatarHora(agenda.data_hora)}</td> 
                                    <td><strong>{agenda.nome_paciente || 'N/A'}</strong></td>
                                    <td>{agenda.servico_tipo}</td>
                                    <td>{formatarDataExibicao(agenda.data_hora)}</td> 
                                    <td><span className={getStatusClassName(agenda.status)}>{agenda.status}</span></td>
                                    <td>
                                        {['Realizado', 'Cancelado'].includes(agenda.status) ? (
                                            <span className={styles.finalizedText}>Finalizado</span>
                                        ) : (
                                            <div className={styles.tableActions}>
                                                <button onClick={() => handleDetalhes(agenda.id)} className={`${styles.actionButton} ${styles.detailButton}`}>Detalhes</button>
                                                <button onClick={() => handleConcluirSessao(agenda.id, agenda.nome_paciente)} className={`${styles.actionButton} ${styles.concludeButton}`}>Concluir</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AgendamentosPage;