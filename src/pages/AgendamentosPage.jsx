import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

// Importa estilos modulares
import styles from './AgendamentosPage.module.css';

// Opções de status disponíveis para o filtro
const statusOptions = ['Todos', 'Pendente', 'Confirmado', 'Realizado', 'Cancelado'];
const servicoOptions = ['Fisioterapia', 'Pilates'];

// ===================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ===================================

/**
 * Formata a data e hora do padrão ISO (API) para o formato de hora (HH:MM).
 */
const formatarHora = (dataString) => {
    if (!dataString) return 'N/A';
    try {
        // Correção: Use dataString diretamente no construtor para evitar problemas de fuso horário local
        return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'Hora Inválida';
    }
}

/**
 * Formata a data do padrão ISO (API) para o formato DD/MM/YYYY para exibição na tabela.
 */
const formatarDataExibicao = (dataString) => {
    if (!dataString) return 'N/A';
    // Se a string contiver a parte T e hora, split garantirá apenas a data
    const datePart = dataString.split('T')[0];
    const [ano, mes, dia] = datePart.split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Retorna a string da data de hoje no formato YYYY-MM-DD (Seguro contra fuso horário).
 */
const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayWithOffset = new Date(today.getTime() - (offset * 60 * 1000));
    return todayWithOffset.toISOString().split('T')[0];
}

const AgendamentosPage = () => {
    const navigate = useNavigate();

    // ===================================
    // ESTADOS
    // ===================================
    const [agendamentos, setAgendamentos] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState(getTodayString()); 
    const [statusFiltro, setStatusFiltro] = useState('Todos');
    // 💡 NOVO ESTADO: Adicionado para permitir filtrar por tipo de serviço nesta página
    const [servicoFiltro, setServicoFiltro] = useState('Todos'); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ===================================
    // FUNÇÕES DE LÓGICA E ESTILO
    // ===================================
    
    // Determina o texto de exibição para a data selecionada
    const dataDisplay = dataSelecionada 
        ? formatarDataExibicao(dataSelecionada) 
        : 'Todas as Datas';

    // Mapeia o status para a classe CSS modular (mantido o original para evitar quebras)
    const getStatusClassName = (status) => {
        switch (status) {
            case 'Realizado':
                return `${styles.statusBadge} ${styles.statusRealizado}`;
            case 'Confirmado':
                return `${styles.statusBadge} ${styles.statusConfirmado}`;
            case 'Cancelado':
                return `${styles.statusBadge} ${styles.statusCancelado}`;
            case 'Pendente':
            default:
                return `${styles.statusBadge} ${styles.statusPendente}`;
        }
    };
    
    // ===================================
    // FUNÇÕES DE ACESSO À API
    // ===================================

    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                // Envia data selecionada (YYYY-MM-DD)
                data: dataSelecionada || null, 
                // Envia string vazia se o filtro for 'Todos'
                status: statusFiltro === 'Todos' ? '' : statusFiltro, 
                // 💡 NOVO FILTRO: Adiciona o filtro de serviço
                servicoTipo: servicoFiltro === 'Todos' ? '' : servicoFiltro
            };

            // 🎯 CORREÇÃO: Usa a rota /agendamentos/dia, que aceita os parâmetros 'data', 'status' e 'servicoTipo'
            const response = await api.get('/agendamentos/dia', { params });
            
            setAgendamentos(response.data.agendamentos || []);

        } catch (err) {
            console.error("Erro ao carregar agendamentos:", err.response || err);
            setError("Falha ao carregar a lista de agendamentos. Tente novamente.");
            setAgendamentos([]);
        } finally {
            setLoading(false);
        }
    }, [dataSelecionada, statusFiltro, servicoFiltro]); // Adicionado servicoFiltro

    // ===================================
    // FUNÇÕES DE EFEITO (GATILHO DA BUSCA)
    // ===================================

    // Requisita a API sempre que dataSelecionada, statusFiltro ou servicoFiltro muda
    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    // ===================================
    // HANDLERS DE AÇÃO
    // ===================================
    const handleAddAgendamentoByService = (service) => {
        navigate(`/agendamentos/novo?servico=${service}`);
    };

    const handleDetalhes = (id) => {
        navigate(`/agendamentos/${id}`);
    };
    
    // Ação de concluir que envia para a nova rota PUT /:id/concluir
    const handleConcluirSessao = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja marcar a sessão de ${nome} como 'Realizado'? Isso debitará uma sessão do pacote ativo, se houver.`)) {
            return;
        }
        try {
            // Usa a rota PUT /:id/concluir do backend
            await api.put(`/agendamentos/${id}/concluir`);
            alert(`Sessão ID ${id} de ${nome} concluída.`);
            
            // Recarrega a lista para mostrar a alteração.
            fetchAgendamentos(); 
        } catch (error) {
            console.error(`Erro ao concluir a sessão:`, error.response || error);
            const errorMessage = error.response?.data?.message || 'Erro interno ao concluir a sessão.';
            alert(errorMessage);
        }
    };

    // ===================================
    // RENDERIZAÇÃO
    // ===================================
    
    if (loading) {
        return <div className={styles.centeredMessage} role="status">Carregando Agenda...</div>;
    }

    if (error) {
        return <div className={`${styles.centeredMessage} ${styles.errorMsg}`} role="alert">{error}</div>;
    }


    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Agenda de Sessões</h1>
                
                <div className={styles.addControls}>
                    {servicoOptions.map(service => (
                        <button 
                            key={service}
                            onClick={() => handleAddAgendamentoByService(service)} 
                            className={styles.addButtonService}
                        >
                            + {service}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className={styles.controlsBar}>
                <label>Filtro de Data:</label>
                <input 
                    type="date" 
                    value={dataSelecionada} 
                    onChange={(e) => setDataSelecionada(e.target.value)} 
                    className={styles.formInput} 
                />

                <label className={styles.statusLabel}>Tipo:</label>
                <select 
                    value={servicoFiltro}
                    onChange={(e) => setServicoFiltro(e.target.value)}
                    className={styles.formSelect} 
                >
                    <option value="Todos">Todos os Serviços</option>
                    {servicoOptions.map(service => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>

                <label className={styles.statusLabel}>Status:</label>
                <select 
                    value={statusFiltro}
                    onChange={(e) => setStatusFiltro(e.target.value)}
                    className={styles.formSelect} 
                >
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

            </div>
            
            <div className={styles.listInfo}>
                <p>Mostrando agendamentos para: <strong>{dataDisplay}</strong> | Serviço: <strong>{servicoFiltro}</strong> | Status: <strong>{statusFiltro}</strong></p>
            </div>


            {agendamentos.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Nenhum agendamento encontrado.</p>
                    <p>Altere a data, o tipo de serviço ou o filtro de status.</p>
                </div>
            ) : (
                <div className={styles.tableResponsive}>
                <table className={styles.agendaTable}>
                    <thead>
                        <tr>
                            <th className={styles.tableHeader}>Hora</th>
                            <th className={styles.tableHeader}>Paciente</th>
                            <th className={styles.tableHeader}>Tipo de Sessão</th>
                            <th className={styles.tableHeader}>Data</th> 
                            <th className={styles.tableHeader}>Status</th>
                            <th className={styles.tableHeader}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agendamentos.map((agenda, index) => (
                            <tr key={agenda.id || index} className={styles.tableRow}>
                                <td className={styles.tableData}>{formatarHora(agenda.data_hora)}</td> 
                                <td className={styles.tableData}>
                                    <strong>{agenda.nome_paciente || `Paciente ID ${agenda.paciente_id}`}</strong>
                                </td>
                                <td className={styles.tableData}>{agenda.servico_tipo || 'Fisioterapia'}</td>
                                <td className={styles.tableData}>{formatarDataExibicao(agenda.data_hora)}</td> 
                                <td className={styles.tableData}>
                                    <span className={getStatusClassName(agenda.status)}>
                                        {agenda.status || 'Pendente'}
                                    </span>
                                </td>
                                <td className={styles.tableDataActions}>
                                    {agenda.status === 'Realizado' || agenda.status === 'Cancelado' ? (
                                        <span className={styles.finalizedText}>Finalizado</span>
                                    ) : (
                                        <div className="table-actions">
                                            <button 
                                                onClick={() => handleDetalhes(agenda.id)} 
                                                className={`${styles.actionButton} ${styles.detailButton}`}
                                            >
                                                Detalhes
                                            </button>
                                            <button 
                                                onClick={() => handleConcluirSessao(agenda.id, agenda.nome_paciente)} 
                                                className={`${styles.actionButton} ${styles.concludeButton}`}
                                            >
                                                Concluir
                                            </button>
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