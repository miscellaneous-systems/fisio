// src/pages/ProntuarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import NotaFormModal from '../components/NotaFormModal'; 
// ⚠️ Importa o arquivo de estilos
import styles from './ProntuarioPage.module.css';

const ProntuarioPage = () => {
    const { pacienteId } = useParams();
    const navigate = useNavigate();

    // Estados de dados e carregamento
    const [paciente, setPaciente] = useState(null);
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados do Formulário de Nova Nota
    const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
    const [novaNotaTitulo, setNovaNotaTitulo] = useState('Evolução Clínica');
    const [submitting, setSubmitting] = useState(false);

    // ESTADOS PARA EDIÇÃO COM MODAL
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [notaToEdit, setNotaToEdit] = useState(null); 

    // Função auxiliar de formatação de data
    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data Inválida';
        return data.toLocaleString('pt-BR');
    };

    // 1. Função de Busca de Dados (Paciente e Notas)
    const fetchDados = async () => {
        setLoading(true);
        try {
            // A. Buscar Dados do Paciente
            const pacienteResponse = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(pacienteResponse.data.paciente);

            // B. Buscar Notas do Prontuário
            const notasResponse = await api.get(`/prontuario/${pacienteId}`);
            setNotas(notasResponse.data.notas);

            setError(null);
        } catch (err) {
            console.error("Erro ao buscar dados do prontuário:", err);
            setError('Não foi possível carregar os dados do prontuário.');
            if (err.response && err.response.status === 404) {
                 alert("Paciente não encontrado!");
                 navigate('/pacientes');
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Função de Criação de Nova Nota
    const handleSubmitNota = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!novaNotaConteudo.trim()) {
            alert("A nota de evolução não pode ser vazia.");
            setSubmitting(false);
            return;
        }

        try {
            const novaNota = {
                paciente_id: parseInt(pacienteId),
                titulo: novaNotaTitulo,
                conteudo: novaNotaConteudo,
                // data_nota e agendamento_id opcionais
            };

            await api.post('/prontuario', novaNota);

            alert("Nota salva com sucesso!");
            setNovaNotaConteudo(''); 
            setNovaNotaTitulo('Evolução Clínica');
            fetchDados(); // Recarrega a lista
            
        } catch (err) {
            console.error("Erro ao salvar nota:", err);
            alert("Erro ao salvar nota de prontuário. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };
    
    // 3. FUNÇÃO PARA ABRIR O MODAL DE EDIÇÃO
    const handleEditNota = (nota) => {
        setNotaToEdit(nota); // Define qual nota será editada
        setIsEditModalOpen(true); // Abre o modal
    };

    // 4. FUNÇÃO PARA SALVAR A EDIÇÃO (Passada ao Modal)
    const handleSaveEdicao = async (notaEditada) => {
        try {
            await api.put(`/prontuario/${notaEditada.id}`, {
                titulo: notaEditada.titulo,
                conteudo: notaEditada.conteudo
            });
            
            alert("Nota atualizada com sucesso!");
            setNotaToEdit(null);
            setIsEditModalOpen(false);
            fetchDados(); 
        } catch (err) {
            console.error("Erro ao atualizar nota:", err);
            alert("Erro ao atualizar nota.");
        }
    };


    // Executa a busca ao carregar o componente
    useEffect(() => {
        fetchDados();
    }, [pacienteId]);


    if (loading) return <h2 className={styles.loadingMessage}>Carregando prontuário...</h2>;
    if (error) return <h2 className={styles.errorMessage}>{error}</h2>;
    if (!paciente) return <h2 className={styles.errorMessage}>Paciente não encontrado.</h2>;


    return (
        <div className={styles.prontuarioContainer}>
            <button onClick={() => navigate('/pacientes')} className={styles.buttonBack}>
                &larr; Voltar para Pacientes
            </button>
            
            <header className={styles.prontuarioHeader}>
                <h1>Prontuário de {paciente.nome}</h1>
                <p>Telefone: <strong>{paciente.telefone}</strong></p>
                <p>Nascimento: {(paciente.data_nascimento || paciente.nascimento) ? new Date(paciente.data_nascimento || paciente.nascimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </header>

            <div className={styles.contentGrid}>
                
                {/* -------------------- COLUNA 1: ADICIONAR NOTA -------------------- */}
                <section className={styles.formSection}>
                    <h2>✍️ Nova Evolução</h2>
                    <form onSubmit={handleSubmitNota} className={styles.notaForm}>
                        <label className={styles.formLabel}>Título (Opcional):</label>
                        <input 
                            type="text" 
                            value={novaNotaTitulo} 
                            onChange={(e) => setNovaNotaTitulo(e.target.value)} 
                            className={styles.formInput}
                            placeholder="Ex: Anamnese Inicial, Evolução da 5ª Sessão..."
                        />
                        <label className={styles.formLabel}>Conteúdo da Nota:</label>
                        <textarea
                            value={novaNotaConteudo}
                            onChange={(e) => setNovaNotaConteudo(e.target.value)}
                            className={styles.formTextarea}
                            rows="8"
                            required
                            placeholder="Descreva a sessão, a evolução, queixas, etc."
                        />
                        <button type="submit" className={styles.buttonSubmit} disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar Nota'}
                        </button>
                    </form>
                </section>

                {/* -------------------- COLUNA 2: HISTÓRICO -------------------- */}
                <section className={styles.historySection}>
                    <h2>📜 Histórico de Notas ({notas.length})</h2>
                    {notas.length === 0 ? (
                        <p className={styles.noNotesMessage}>Nenhuma nota de prontuário registrada ainda.</p>
                    ) : (
                        <div className={styles.notesList}>
                            {notas.map((nota) => (
                                <div key={nota.id} className={styles.noteCard}>
                                    <div className={styles.noteHeader}>
                                        <h3 className={styles.noteTitle}>{nota.titulo || 'Evolução Clínica'}</h3>
                                        <span className={styles.noteDate}>
                                            {formatarData(nota.data_nota)}
                                        </span>
                                    </div>
                                    <p className={styles.noteContent}>{nota.conteudo}</p>
                                    <p className={styles.noteAuthor}>
                                        Fisioterapeuta: <strong>{nota.nome_fisioterapeuta}</strong>
                                    </p>
                                    {/* Botão de Edição - Agora chama a função de edição */}
                                    <button 
                                        onClick={() => handleEditNota(nota)}
                                        className={styles.buttonEdit}
                                    >
                                        ✏️ Editar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            
            {/* 5. COMPONENTE MODAL DE EDIÇÃO */}
            {isEditModalOpen && (
                <NotaFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    nota={notaToEdit}
                    onSave={handleSaveEdicao}
                />
            )}
        </div>
    );
};
export default ProntuarioPage;