import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
// import AgendamentoFormModal from '../components/AgendamentoFormModal'; // Removido se não for usado
import styles from './PilatesPage.module.css';

// 🎯 FILTRO PRINCIPAL FIXO PARA ESTA PÁGINA
const SERVICE_TYPE = 'Pilates';

// Opções de status disponíveis para o filtro
const statusOptions = ['Todos', 'Pendente', 'Confirmado', 'Realizado', 'Cancelado']; // Adicionado Confirmado

// ✅ FUNÇÃO: Formata a string YYYY-MM-DD para DD/MM/YYYY (Apenas para exibição em texto, NUNCA para o <input type="date">.
const formatarDataExibicao = (dataString) => {
    if (!dataString) return '';
    // Garante que se a string tiver hora, pegamos apenas a parte da data
    const datePart = dataString.split('T')[0];
    const [ano, mes, dia] = datePart.split('-');
    return `${dia}/${mes}/${ano}`; 
};

// Funções utilitárias para classes CSS dinâmicas
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'Realizado':
            return styles.statusRealizado;
        case 'Confirmado':
            return styles.statusConfirmado;
        case 'Cancelado':
            return styles.statusCancelado;
        default:
            return styles.statusPendente;
    }
};

const PilatesPage = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado da data: Deve SEMPRE estar no formato YYYY-MM-DD para o input
    const getTodayString = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const todayWithOffset = new Date(today.getTime() - (offset*60*1000));
        return todayWithOffset.toISOString().split('T')[0];
    }
    const [dataSelecionada, setDataSelecionada] = useState(getTodayString()); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFiltro, setStatusFiltro] = useState('Todos'); 

    // ✅ CORREÇÃO 1: Usando useCallback para memoizar a função e evitar recriação desnecessária
    const fetchAgendamentos = useCallback(async () => {
        setLoading(true);
        try {
            // Prepara os parâmetros usando os estados atuais
            const data = dataSelecionada; 
            // Mapeia 'Todos' para uma string vazia, para que o backend ignore o filtro de status.
            const status = statusFiltro === 'Todos' ? '' : statusFiltro; 

            // 🎯 CORREÇÃO CRÍTICA: Troca a rota para /agendamentos/dia e garante o servicoTipo
            const response = await api.get(`/agendamentos/dia`, { 
                params: {
                    data: data, 
                    status: status,
                    servicoTipo: SERVICE_TYPE // Garante o filtro de Pilates
                }
            });
            
            setAgendamentos(response.data.agendamentos || []);
            setError(null);
        } catch (err) {
            console.error(`Erro ao buscar sessões de ${SERVICE_TYPE}:`, err.response || err);
            // 💡 Se o erro for 403 (Token inválido/expirado), desloga o usuário.
            if (err.response?.status === 403) {
                signOut();
                return; 
            }
            setError(`Não foi possível carregar a agenda de ${SERVICE_TYPE}. Verifique sua conexão.`);
        } finally {
            setLoading(false);
        }
    }, [dataSelecionada, statusFiltro, signOut]); 

    // ✅ useEffect agora depende apenas da função memoizada
    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]); 
    
    const handleDetalhes = (agendamentoId) => {
        navigate(`/agendamentos/${agendamentoId}`);
    };

    const handleAddAgendamento = () => {
        // Redireciona para o formulário, mas pré-selecionando o Pilates
        navigate(`/agendamentos/novo?servico=${SERVICE_TYPE}`);
        // Ou use o modal: setIsModalOpen(true); 
    };

    const handleConcluirSessao = async (agendamentoId, pacienteNome) => {
        if (!window.confirm(`Tem certeza que deseja CONCLUIR a sessão de ${pacienteNome}? Isso debitará uma sessão do pacote ativo, se houver.`)) {
            return;
        }

        try {
             // 🎯 CORREÇÃO: Usa a rota PUT /:id/concluir, que gerencia o débito no backend
            await api.put(`/agendamentos/${agendamentoId}/concluir`); 
            alert(`Sessão de ${pacienteNome} concluída e pacote debitado (se ativo)!`);
            // Recarrega a lista
            fetchAgendamentos(); 
            
        } catch (err) {
            console.error("Erro ao concluir sessão:", err.response || err);
            const errorMessage = err.response?.data?.message || 'Erro ao concluir sessão. Verifique o pacote e a validade.';
            alert(errorMessage);
        }
    };

    // Usa a nova função de formatação para exibição
    const dataDisplay = dataSelecionada ? formatarDataExibicao(dataSelecionada) : 'TODAS AS DATAS';

    // FUNÇÃO DE FORMATAR HORA (Adicionada para completar a dependência da tabela)
    const formatarHora = (dataString) => {
        if (!dataString) return 'N/A';
        try {
            return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return 'Hora Inválida';
        }
    }


    if (loading) {
        return <h2 className={styles.loadingMessage}>Carregando agenda de {SERVICE_TYPE} para {dataDisplay}...</h2>;
    }

    if (error) {
        return <h2 className={styles.errorMessage}>{error}</h2>;
    }

    return (
        <div className={styles.pilatesContainer}>
            <div className={styles.pilatesHeader}>
                <h1>🧘 Agenda de {SERVICE_TYPE}</h1>
                <button onClick={handleAddAgendamento} className={styles.buttonAdd}>
                    + Novo Agendamento de {SERVICE_TYPE}
                </button>
            </div>
            
            <div className={styles.pilatesControls}>
                <label>Data:</label>
                <input 
                    type="date" 
                    value={dataSelecionada} 
                    onChange={(e) => setDataSelecionada(e.target.value)} 
                    className={styles.dateInput}
                />

                <label className={styles.statusLabel}>Status:</label>
                <select 
                    value={statusFiltro}
                    onChange={(e) => setStatusFiltro(e.target.value)}
                    className={styles.statusSelect}
                >
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            
            {agendamentos.length === 0 ? (
                <p className={styles.noDataMessage}>Nenhuma sessão de <strong>{SERVICE_TYPE}</strong> com status <strong>{statusFiltro}</strong> para <strong>{dataDisplay}</strong>.</p>
            ) : (
                <table className={styles.pilatesTable}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Hora</th>
                            <th className={styles.th}>Paciente</th>
                            <th className={styles.th}>Tipo de Sessão</th>
                            <th className={styles.th}>Data</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agendamentos.map((agenda) => (
                            <tr key={agenda.id}>
                                <td className={`${styles.td} ${styles.timeColumn}`}>{formatarHora(agenda.data_hora)}</td>
                                <td className={styles.td}>{agenda.nome_paciente || 'Paciente Teste'}</td>
                                <td className={styles.td}>{agenda.servico_tipo || 'Pilates'}</td>
                                <td className={styles.td}>{formatarDataExibicao(agenda.data_hora)}</td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(agenda.status)}`}>
                                        {agenda.status || 'Pendente'}
                                    </span>
                                </td>
                                <td className={`${styles.td} ${styles.actionColumn}`}>
                                    {agenda.status === 'Realizado' || agenda.status === 'Cancelado' ? (
                                        <span className={styles.sessionFinalizedText}>Sessão Finalizada</span>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleDetalhes(agenda.id)} 
                                                className={`${styles.actionButton} ${styles.buttonDetails}`}
                                            >
                                                Detalhes
                                            </button>
                                            <button 
                                                onClick={() => handleConcluirSessao(agenda.id, agenda.nome_paciente)} 
                                                className={`${styles.actionButton} ${styles.buttonConclude}`}
                                            >
                                                Concluir Sessão
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr> 
                        ))}
                    </tbody>
                </table>
            )}

            {/* <AgendamentoFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAgendamentoAdded={fetchAgendamentos}
            /> */}
        </div>
    );
};

export default PilatesPage;