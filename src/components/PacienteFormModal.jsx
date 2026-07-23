import React, { useState, useEffect } from 'react';
import api from '../api/api';
import styles from './PacienteFormModal.module.css'; // 💡 Importa os estilos corretos

const PacienteFormModal = ({ isOpen, onClose, onSave, paciente }) => {
    // Define se o modal está em modo de edição ou criação
    const isEditing = paciente && paciente.id;

    // Estado inicial do formulário
    const getInitialState = () => {
        // Ler data_nascimento (frontend) ou nascimento (backend)
        const dataRaw = paciente?.data_nascimento || paciente?.nascimento || '';
        
        return {
            nome: paciente?.nome || '',
            telefone: paciente?.telefone || '',
            email: paciente?.email || '',
            data_nascimento: dataRaw.includes('T') ? dataRaw.split('T')[0] : dataRaw,
        };
    };

    const [formData, setFormData] = useState(getInitialState());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Efeito para resetar o formulário quando o paciente ou o estado de abertura muda
    useEffect(() => {
        setFormData(getInitialState());
        setError(null); // Limpa erros ao reabrir
    }, [isOpen, paciente]);

    // Handler para atualizar o estado do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler para submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validação simples
        if (!formData.nome || !formData.data_nascimento) {
            setError('Nome e Data de Nascimento são obrigatórios.');
            setSubmitting(false);
            return;
        }

        // Mapeia 'data_nascimento' para 'nascimento' (esperado pelo backend)
        const dadosParaEnviar = {
            ...formData,
            nascimento: formData.data_nascimento
        };
        // Remove a chave duplicada/incorreta para limpar o payload
        delete dadosParaEnviar.data_nascimento;

        try {
            let response;
            if (isEditing) {
                response = await api.patch(`/pacientes/${paciente.id}`, dadosParaEnviar);
            } else {
                // Cria novo paciente
                response = await api.post('/pacientes', dadosParaEnviar);
            }
            
            onSave(response.data.paciente || response.data); // Callback para atualizar a lista na página
            onClose(); // Fecha o modal

        } catch (err) {
            console.error("Erro ao salvar paciente:", err.response || err);
            setError(err.response?.data?.message || 'Ocorreu um erro ao salvar. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                
                <div className={styles.modalHeader}>
                    <h2>{isEditing ? 'Editar Paciente' : 'Adicionar Novo Paciente'}</h2>
                    <button onClick={onClose} className={styles.closeBtn} disabled={submitting}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

                    <div className={styles.formGroup}>
                        <label htmlFor="nome" className={styles.formLabel}>Nome Completo</label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className={styles.formInput}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="data_nascimento" className={styles.formLabel}>Data de Nascimento</label>
                        <input
                            type="date"
                            id="data_nascimento"
                            name="data_nascimento"
                            value={formData.data_nascimento}
                            onChange={handleChange}
                            className={styles.formInput}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="telefone" className={styles.formLabel}>Telefone</label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            className={styles.formInput}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.formLabel}>Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={submitting}>Cancelar</button>
                        <button type="submit" className={styles.saveButton} disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar Paciente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PacienteFormModal;