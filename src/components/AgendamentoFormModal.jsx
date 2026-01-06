import React, { useState, useEffect } from 'react';
import api from '../api/api';
// 💡 1. Importa o CSS Module
import styles from './AgendamentoFormModal.module.css';

const AgendamentoFormModal = ({ isOpen, onClose, onAgendamentoAdded }) => {
    const [pacientes, setPacientes] = useState([]);
    const [pacienteId, setPacienteId] = useState('');
    const [tipoSessao, setTipoSessao] = useState('Fisioterapia');
    const [dataHora, setDataHora] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);

    const resetForm = () => {
        setPacienteId('');
        setTipoSessao('Fisioterapia');
        setDataHora('');
        setObservacoes('');
        setErro(null);
    };

    useEffect(() => {
        if (isOpen) {
            const fetchPacientes = async () => {
                setLoading(true);
                try {
                    const response = await api.get('/pacientes');
                    setPacientes(response.data.pacientes || response.data || []);
                } catch (err) {
                    console.error("Erro ao buscar pacientes:", err);
                    setErro("Não foi possível carregar os pacientes.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPacientes();
            resetForm();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);
        try {
            const payload = {
                paciente_id: parseInt(pacienteId),
                data_hora: dataHora,
                tipo_sessao: tipoSessao,
                observacoes: observacoes,
                status: 'Agendado'
            };
            const response = await api.post('/agendamentos', payload);
            onAgendamentoAdded(response.data);
            onClose();
        } catch (err) {
            console.error("Erro ao criar agendamento:", err.response || err);
            setErro(err.response?.data?.message || "Ocorreu um erro ao agendar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Novo Agendamento</h2>
                    <button onClick={onClose} className={styles.closeButton} disabled={loading}>
                        &times;
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {erro && <p className={styles.errorMsg}>⚠️ {erro}</p>}

                    <div className={styles.formGroup}>
                        <label htmlFor="pacienteId" className={styles.formLabel}>Paciente</label>
                        <select 
                            id="pacienteId"
                            value={pacienteId} 
                            onChange={(e) => setPacienteId(e.target.value)} 
                            className={styles.formInput} 
                            required
                            disabled={loading || pacientes.length === 0}
                        >
                            <option value="">{loading ? 'Carregando...' : 'Selecione um Paciente'}</option>
                            {pacientes.map(p => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                        {pacientes.length === 0 && !loading && <p className={styles.warning}>Nenhum paciente cadastrado. Cadastre um primeiro.</p>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="tipoSessao" className={styles.formLabel}>Tipo de Sessão</label>
                        <select 
                            id="tipoSessao"
                            value={tipoSessao} 
                            onChange={(e) => setTipoSessao(e.target.value)} 
                            className={styles.formInput} 
                            required
                        >
                            <option value="Fisioterapia">Fisioterapia</option>
                            <option value="Pilates">Pilates</option>
                            <option value="Avaliação">Avaliação Inicial</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="dataHora" className={styles.formLabel}>Data e Hora</label>
                        <input 
                            id="dataHora"
                            type="datetime-local" 
                            value={dataHora} 
                            onChange={(e) => setDataHora(e.target.value)} 
                            className={styles.formInput} 
                            required 
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="observacoes" className={styles.formLabel}>Observações (Opcional)</label>
                        <textarea 
                            id="observacoes"
                            value={observacoes} 
                            onChange={(e) => setObservacoes(e.target.value)} 
                            className={`${styles.formInput} ${styles.textarea}`} 
                        />
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={loading || !pacienteId}>
                        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AgendamentoFormModal;