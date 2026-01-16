import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import AtendimentoModal from '../components/AtendimentoModal';

// Importa estilos modulares
import styles from './DetalheAgendamentoPage.module.css';

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

    // ESTADOS
    const [agendamento, setAgendamento] = useState(null);
    const [pacientes, setPacientes] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // Filtro igual ao de Pacientes
    const [loading, setLoading] = useState(true);
    const [loadingPacientes, setLoadingPacientes] = useState(isNew);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isAtendimentoOpen, setIsAtendimentoOpen] = useState(false);

    // BUSCA DE DADOS
    const fetchPacientes = async () => {
        setLoadingPacientes(true);
        try {
            const response = await api.get('/pacientes');
            const lista = response.data.pacientes || response.data || [];
            setPacientes(lista.sort((a, b) => a.nome.localeCompare(b.nome)));
        } catch (err) {
            setError('Erro ao carregar pacientes.');
        } finally {
            setLoadingPacientes(false);
        }
    };

    const fetchDetalhesAgendamento = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/agendamentos/${agendamentoId}`);
            setAgendamento(response.data.agendamento);
        } catch (err) {
            setError('Agendamento não encontrado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isNew) {
            fetchDetalhesAgendamento();
        } else {
            fetchPacientes();
            const params = new URLSearchParams(location.search);
            setAgendamento({
                paciente_id: '',
                data_hora: formatDateToLocalInput(new Date()),
                servico_tipo: params.get('servico') || 'Fisioterapia',
                duracao_minutos: 60,
                status: 'Pendente',
                observacoes: '',
            });
            setLoading(false);
        }
    }, [agendamentoId, isNew]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAgendamento(prev => ({ 
            ...prev, 
            [name]: name === 'paciente_id' ? parseInt(value, 10) : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agendamento?.paciente_id) return alert('Selecione um paciente.');
        setSubmitting(true);
        try {
            const dataToSubmit = {
                ...agendamento,
                data_hora: new Date(agendamento.data_hora).toISOString(),
            };
            await api.post('/agendamentos', dataToSubmit);
            alert('Agendamento criado!');
            navigate('/agenda/sessoes');
        } catch (err) {
            alert('Erro ao salvar.');
        } finally {
            setSubmitting(false);
        }
    };

    // SEGURANÇA: Evita erro de "null" no render
    if (loading || !agendamento) {
        return <div className={styles.loading}>Carregando...</div>;
    }

    const isSessionFinished = agendamento?.status === 'Realizado' || agendamento?.status === 'Cancelado';

    return (
        <div className={styles.container}>
            <button onClick={() => navigate('/agenda/sessoes')} className={styles.backButton}>
                &larr; Voltar para Agenda
            </button>

            {isNew ? (
                <>
                    <h1 className={styles.pageTitle}>Novo Agendamento: {agendamento?.servico_tipo}</h1>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>👤 Selecionar Paciente</label>
                            
                            {/* BARRA DE PESQUISA (Igual à PacientesPage) */}
                            <div className={styles.searchInputContainer}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar paciente por nome..."
                                    className={styles.searchInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select
                                name="paciente_id"
                                value={agendamento?.paciente_id || ''}
                                onChange={handleInputChange}
                                required
                                className={styles.input}
                            >
                                <option value="">{loadingPacientes ? 'Carregando...' : 'Selecione o paciente...'}</option>
                                {pacientes
                                    .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(p => <option key={p.id} value={p.id}>{p.nome}</option>)
                                }
                            </select>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>⏰ Data e Hora</label>
                                <input type="datetime-local" name="data_hora" value={agendamento?.data_hora} onChange={handleInputChange} className={styles.input} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>⏱️ Duração (min)</label>
                                <input type="number" name="duracao_minutos" value={agendamento?.duracao_minutos} onChange={handleInputChange} className={styles.input} required />
                            </div>
                        </div>

                        <button type="submit" disabled={submitting} className={styles.submitButton}>
                            {submitting ? 'Salvando...' : '✅ Confirmar Agendamento'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <header className={styles.header}>
                        <h1>Agendamento #{agendamento?.id}</h1>
                        <span className={styles.statusBadge} style={{backgroundColor: agendamento?.status === 'Realizado' ? '#2ecc71' : '#f39c12'}}>
                            {agendamento?.status}
                        </span>
                    </header>
                    <div className={styles.detailsGrid}>
                        <div className={styles.card}>
                            <h2>Paciente: {agendamento?.nome_paciente}</h2>
                            <p><strong>Serviço:</strong> {agendamento?.servico_tipo}</p>
                            <p><strong>Data:</strong> {new Date(agendamento?.data_hora).toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DetalheAgendamentoPage;