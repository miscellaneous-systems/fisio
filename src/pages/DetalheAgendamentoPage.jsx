import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import AtendimentoModal from '../components/AtendimentoModal'; // 💡 Importa o novo modal

// 💡 Importa estilos modulares
import styles from './DetalheAgendamentoPage.module.css';

// FUNÇÃO AUXILIAR: Formata a data/hora para o formato local esperado pelo input datetime-local (YYYY-MM-DDTHH:MM)
const formatDateToLocalInput = (dateObject) => {
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    const hour = String(dateObject.getHours()).padStart(2, '0');
    const minute = String(dateObject.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
};

const DetalheAgendamentoPage = () => {
    const { agendamentoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); 

    const isNew = agendamentoId === 'novo'; 

    const [agendamento, setAgendamento] = useState(null);
    const [pacientes, setPacientes] = useState([]); 
    const [loading, setLoading] = useState(!isNew); 
    const [loadingPacientes, setLoadingPacientes] = useState(isNew); 
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isAtendimentoOpen, setIsAtendimentoOpen] = useState(false); // 💡 Estado do Modal

    // --- Funções Auxiliares ---

    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data Inválida';
        return data.toLocaleString('pt-BR');
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Converte paciente_id para number se o campo for paciente_id
        const finalValue = name === 'paciente_id' && value !== '' ? parseInt(value, 10) : value; 
        
        setAgendamento(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!agendamento.paciente_id) {
            setError('Por favor, selecione um paciente.');
            setSubmitting(false);
            return;
        }

        try {
            const dataToSubmit = {
                ...agendamento,
                data_hora: new Date(agendamento.data_hora).toISOString(),
                duracao_minutos: parseInt(agendamento.duracao_minutos, 10),
            };

            await api.post('/agendamentos', dataToSubmit);
            alert('Agendamento criado com sucesso!');
            navigate('/agendamentos'); 
        } catch (err) {
            console.error("Erro ao criar agendamento:", err.response || err);
            setError(err.response?.data?.message || 'Erro ao criar agendamento. Verifique os dados e a conexão.');
        } finally {
            setSubmitting(false);
        }
    };


    // Função para buscar a lista de pacientes
    const fetchPacientes = async () => {
        setLoadingPacientes(true);
        try {
            const response = await api.get('/pacientes');
            setPacientes(response.data.pacientes || response.data || []); 
        } catch (err) {
            console.error("Erro ao buscar pacientes:", err.response || err);
            setError('Não foi possível carregar a lista de pacientes.');
        } finally {
            setLoadingPacientes(false);
        }
    };

    // --- Funções de Detalhes ---

    const fetchDetalhesAgendamento = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/agendamentos/${agendamentoId}`);
            setAgendamento(response.data.agendamento);
            setError(null);
        } catch (err) {
            console.error("Erro ao buscar detalhes do agendamento:", err.response || err);
            setError('Não foi possível carregar os detalhes do agendamento. Verifique se o ID existe.');
            setAgendamento(null);
        } finally {
            setLoading(false);
        }
    };

    // LÓGICA DE CONCLUSÃO DE SESSÃO IMPLEMENTADA
    const handleConcluirSessao = async () => {
        if (!window.confirm("Tem certeza que deseja CONCLUIR esta sessão? Isso debitará um pacote ou crédito do paciente.")) {
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const response = await api.put(`/agendamentos/${agendamentoId}/concluir`, {
                status: 'Realizado' 
            });
            
            setAgendamento(response.data.agendamento);
            alert('Sessão concluída com sucesso! Pacote debitado (ou crédito registrado).');

        } catch (err) {
            console.error("Erro ao concluir a sessão:", err.response || err);
            setError(err.response?.data?.message || 'Erro ao concluir a sessão. Verifique o status do pacote e o backend.');
        } finally {
            setSubmitting(false);
        }
    };

    // LÓGICA DE CANCELAMENTO IMPLEMENTADA
    const handleCancelarAgendamento = async () => {
        if (!window.confirm("Tem certeza que deseja CANCELAR este agendamento?")) {
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const response = await api.put(`/agendamentos/${agendamentoId}/cancelar`, {
                status: 'Cancelado' 
            });

            setAgendamento(response.data.agendamento);
            alert('Agendamento cancelado com sucesso.');
            
        } catch (err) {
            console.error("Erro ao cancelar agendamento:", err.response || err);
            setError(err.response?.data?.message || 'Erro ao cancelar agendamento.');
        } finally {
            setSubmitting(false);
        }
    };

    // 💡 LÓGICA DE SALVAR ATENDIMENTO (Avaliação ou Evolução)
    const handleSaveAtendimento = async (titulo, conteudo) => {
        setSubmitting(true);
        try {
            // Salva como uma nota de prontuário
            await api.post('/prontuario', {
                paciente_id: agendamento.paciente_id,
                titulo: titulo,
                conteudo: conteudo
            });

            alert(`${titulo} salva com sucesso no prontuário!`);
            setIsAtendimentoOpen(false); // Fecha o modal
            
            // Opcional: Perguntar se deseja concluir a sessão agora
            // if(window.confirm("Deseja marcar a sessão como Concluída agora?")) { handleConcluirSessao(); }

        } catch (err) {
            console.error("Erro ao salvar atendimento:", err);
            alert("Erro ao salvar o registro. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    // useEffect PRINCIPAL: Carrega ou Inicializa
    useEffect(() => {
        if (!isNew) {
            fetchDetalhesAgendamento();
        } else {
            // Modo CRIAÇÃO ('novo')
            fetchPacientes(); 

            const params = new URLSearchParams(location.search);
            const servicoUrl = params.get('servico'); 
            const servicoPadrao = servicoUrl || 'Fisioterapia'; 
            
            const initialDate = new Date();

            setAgendamento({
                paciente_id: '', 
                data_hora: formatDateToLocalInput(initialDate), 
                servico_tipo: servicoPadrao, 
                duracao_minutos: 60,
                status: 'Pendente',
                observacoes: '',
            });
            setError(null);
            setLoading(false);
        }
    }, [agendamentoId, isNew, location.search]);

    
    // --- Controles de Renderização/Carregamento ---
    // 💡 Usa classes modulares
    if (loading) return <h2 className={styles.loading}>Carregando detalhes do agendamento...</h2>;
    if (error && !isNew) return <h2 className={styles.error}>{error}</h2>; 
    
    if (isNew && (!agendamento || loadingPacientes)) {
        return <h2 className={styles.loading}>Preparando formulário... {loadingPacientes ? 'Buscando pacientes...' : ''}</h2>;
    }
    
    if (!agendamento && !isNew) return <h2 className={styles.error}>Agendamento não encontrado.</h2>;


    // Determina a cor do status (Mantido com style={...} por ser dinâmico no badge)
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendente': return '#f39c12';
            case 'Realizado': return '#2ecc71';
            case 'Cancelado': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    // ⬇️ Renderização para CRIAÇÃO (Se for 'novo')
    if (isNew) {
        return (
            <div className={styles.container}> {/* 💡 Usa classe modular */}
                <button onClick={() => navigate('/agenda/sessoes')} className={styles.backButton}> {/* 💡 Usa classe modular */}
                    &larr; Voltar para Agenda
                </button>
                <h1 style={{borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                    Criar Novo Agendamento: <span style={{color: '#2980b9'}}>{agendamento.servico_tipo}</span>
                </h1>
                
                {error && <p className={styles.formError}>⚠️ {error}</p>} {/* 💡 Usa classe modular */}

                <form onSubmit={handleSubmit} className={styles.form}> {/* 💡 Usa classe modular */}
                    
                    {/* 1. SELEÇÃO DE PACIENTE - CORRIGIDO AQUI */}
                    <div className={styles.formGroup}> {/* 💡 Usa classe modular */}
                        <label className={styles.label} htmlFor="paciente_id">👤 Paciente</label> {/* 💡 Usa classe modular */}
                        <select
                            name="paciente_id"
                            value={agendamento.paciente_id || ''} 
                            onChange={handleInputChange}
                            required
                            className={styles.input}
                            disabled={submitting || loadingPacientes}
                        >
                            <option value="" disabled>
                                {loadingPacientes ? 'Carregando pacientes...' : 'Selecione um paciente...'}
                            </option>
                            {pacientes.map(paciente => (
                                <option key={paciente.id} value={paciente.id}>
                                    {paciente.nome || `Paciente ID: ${paciente.id}`}
                                </option>
                            ))}
                        </select>
                        {pacientes.length === 0 && !loadingPacientes && (
                            <p style={{marginTop: '5px', fontSize: '12px', color: '#c0392b'}}>
                                Nenhuma paciente encontrado. Crie um paciente primeiro.
                            </p>
                        )}
                    </div>

                    {/* 2. TIPO DE SERVIÇO (Pré-selecionado) */}
                    <div className={styles.formGroup}> {/* 💡 Usa classe modular */}
                        <label className={styles.label} htmlFor="servico_tipo">🩺 Tipo de Serviço</label> {/* 💡 Usa classe modular */}
                        <select
                            name="servico_tipo"
                            value={agendamento.servico_tipo}
                            onChange={handleInputChange}
                            required
                            className={styles.input} 
                            disabled={submitting}
                        >
                            <option value="Fisioterapia">Fisioterapia</option>
                            <option value="Pilates">Pilates</option>
                        </select>
                    </div>

                    {/* 3. DATA E HORA */}
                    <div className={styles.formGroup}> {/* 💡 Usa classe modular */}
                        <label className={styles.label} htmlFor="data_hora">⏰ Data e Hora</label> 
                        <input
                            type="datetime-local"
                            name="data_hora"
                            value={agendamento.data_hora} 
                            onChange={handleInputChange}
                            required
                            className={styles.input} 
                            disabled={submitting}
                        />
                    </div>
                    
                    {/* 4. DURAÇÃO */}
                    <div className={styles.formGroup}> {/* 💡 Usa classe modular */}
                        <label className={styles.label} htmlFor="duracao_minutos">⏱️ Duração (min)</label>
                        <input
                            type="number"
                            name="duracao_minutos"
                            value={agendamento.duracao_minutos}
                            onChange={handleInputChange}
                            required
                            min="15"
                            max="180"
                            className={styles.input} 
                            disabled={submitting}
                        />
                    </div>

                    {/* 5. OBSERVAÇÕES (Opcional) */}
                    <div className={styles.formGroup}> {/* 💡 Usa classe modular */}
                        <label className={styles.label} htmlFor="observacoes">🗒️ Observações</label> 
                        <textarea
                            name="observacoes"
                            value={agendamento.observacoes || ''}
                            onChange={handleInputChange}
                            className={`${styles.input} ${styles.textarea}`} 
                            disabled={submitting}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting || pacientes.length === 0} 
                        className={styles.submitButton} 
                    >
                        {submitting ? 'Salvando...' : '✅ Salvar Agendamento'}
                    </button>
                </form>
            </div>
        );
    }
    
    // ⬇️ Renderização para DETALHES/EDIÇÃO 
    const isSessionFinished = agendamento?.status === 'Realizado' || agendamento?.status === 'Cancelado'; 
    
    return (
        <div className={styles.container}> {/* 💡 Usa classe modular */}
            <button onClick={() => navigate('/agenda/sessoes')} className={styles.backButton}> {/* 💡 Usa classe modular */}
                &larr; Voltar para Agenda
            </button>
            
            <header className={styles.header}> {/* 💡 Usa classe modular */}
                <h1>Detalhes do Agendamento #{agendamento.id}</h1>
                {/* 💡 Mantém style={...} para a cor dinâmica do status */}
                <p className={styles.statusBadge} style={{backgroundColor: getStatusColor(agendamento.status)}}> 
                    Status: {agendamento.status}
                </p>
            </header>
            
            {error && <p className={styles.actionError}>⚠️ {error}</p>} {/* 💡 Usa classe modular */}

            <div className={styles.detailsGrid}> {/* 💡 Usa classe modular */}
                <section className={styles.card}> {/* 💡 Usa classe modular */}
                    <h2>🗓️ Informações da Sessão</h2>
                    <p><strong>Data/Hora:</strong> {formatarData(agendamento.data_hora)}</p>
                    <p><strong>Duração:</strong> {agendamento.duracao_minutos} minutos</p>
                    <p><strong>Serviço:</strong> {agendamento.servico_tipo}</p>
                    <p><strong>Observações:</strong> {agendamento.observacoes || 'Nenhuma'}</p>
                    <hr />
                    <p style={{color: agendamento.pacote_ativo_id ? '#27ae60' : '#c0392b'}}>
                        {agendamento.pacote_ativo_id 
                            ? `🔗 Pacote Ativo Detectado: ID #${agendamento.pacote_ativo_id}` 
                            : '⚠️ Não há pacote ativo para debitar.'
                        }
                    </p>
                </section>
                <section className={styles.card}> 
                    <h2>👤 Informações do Paciente</h2>
                    <p><strong>Nome:</strong> {agendamento.nome_paciente}</p>
                    <p><strong>Telefone:</strong> {agendamento.telefone}</p>
                    <button 
                        onClick={() => navigate(`/pacientes/${agendamento.paciente_id}`)}
                        className={styles.prontuarioButton} 
                    >
                        Ver Prontuário Completo
                    </button>
                </section>
            </div>
            
            <section className={styles.actionSection}> 
                <h2>Ações da Sessão</h2>
                
                {/* 💡 BOTÃO DE INICIAR ATENDIMENTO */}
                {!isSessionFinished && (
                    <button 
                        onClick={() => setIsAtendimentoOpen(true)}
                        className={styles.actionButton}
                        style={{backgroundColor: '#3498db', marginRight: '10px'}}
                    >
                        ▶ Iniciar Atendimento
                    </button>
                )}

                <button 
                    onClick={handleConcluirSessao}
                    disabled={submitting || isSessionFinished}
                    className={styles.actionButton} 
                    style={{backgroundColor: '#27ae60'}} /* Mantido inline para a cor */
                >
                    {submitting 
                        ? 'Processando...' 
                        : isSessionFinished 
                            ? (agendamento?.status === 'Cancelado' ? 'Agendamento Cancelado' : 'Sessão Concluída') 
                            : '✅ Concluir Sessão & Debitar Pacote'
                    }
                </button>
                {!isSessionFinished && (
                    <button 
                        onClick={handleCancelarAgendamento}
                        disabled={submitting}
                        className={styles.actionButton} 
                        style={{backgroundColor: '#e74c3c', marginLeft: '10px'}} /* Mantido inline para cor e margem */
                    >
                        {submitting ? 'Processando...' : '❌ Cancelar Agendamento'}
                    </button>
                )}
            </section>

            {/* 💡 RENDERIZA O MODAL DE ATENDIMENTO */}
            <AtendimentoModal 
                isOpen={isAtendimentoOpen}
                onClose={() => setIsAtendimentoOpen(false)}
                onSave={handleSaveAtendimento}
                pacienteNome={agendamento.nome_paciente}
            />
        </div>
    );
};
export default DetalheAgendamentoPage;