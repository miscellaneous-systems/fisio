// src/pages/ProntuarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Printer, 
    Edit, 
    ArrowLeft, 
    FileText, 
    User, 
    Calendar, 
    Phone, 
    Stethoscope,
    PlusCircle 
} from 'lucide-react';
import api from '../api/api';
import NotaFormModal from '../components/NotaFormModal'; 
import styles from './ProntuarioPage.module.css';

const ProntuarioPage = () => {
    const { pacienteId } = useParams();
    const navigate = useNavigate();

    const [paciente, setPaciente] = useState(null);
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [novaNotaConteudo, setNovaNotaConteudo] = useState('');
    const [novaNotaTitulo, setNovaNotaTitulo] = useState('Evolução Clínica');
    const [submitting, setSubmitting] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [notaToEdit, setNotaToEdit] = useState(null); 

    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return 'Data Inválida';
        return data.toLocaleString('pt-BR');
    };

    const fetchDados = async () => {
        setLoading(true);
        try {
            const pacienteResponse = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(pacienteResponse.data.paciente);

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
            };

            await api.post('/prontuario', novaNota);

            alert("Nota salva com sucesso!");
            setNovaNotaConteudo(''); 
            setNovaNotaTitulo('Evolução Clínica');
            fetchDados(); 
            
        } catch (err) {
            console.error("Erro ao salvar nota:", err);
            alert("Erro ao salvar nota de prontuário. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleEditNota = (nota) => {
        setNotaToEdit(nota);
        setIsEditModalOpen(true);
    };

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

    const handlePrintNota = (nota) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir Nota - ${nota.titulo || 'Evolução'}</title>
                    <style>
                        body { font-family: 'Poppins', Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .meta { margin-bottom: 20px; color: #555; font-size: 14px; }
                        .content { white-space: pre-wrap; line-height: 1.6; font-size: 14px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                        .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>${nota.titulo || 'Evolução Clínica'}</h1>
                    <div class="meta">
                        <strong>Paciente:</strong> ${paciente?.nome || 'N/A'}<br>
                        <strong>Data da Nota:</strong> ${formatarData(nota.data_nota)}<br>
                        <strong>Profissional:</strong> ${nota.nome_fisioterapeuta || 'N/A'}
                    </div>
                    <div class="content">${nota.conteudo}</div>
                    <div class="footer">Documento gerado pelo sistema FisioApp</div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    useEffect(() => {
        fetchDados();
    }, [pacienteId]);

    if (loading) {
        return <div className={styles.centeredMessage} role="status">Carregando prontuário...</div>;
    }
    if (error) return <h2 className={styles.errorMessage}>{error}</h2>;
    if (!paciente) return <h2 className={styles.errorMessage}>Paciente não encontrado.</h2>;

    return (
        <div className={styles.prontuarioContainer}>
            <button onClick={() => navigate('/pacientes')} className={styles.buttonBack}>
                <ArrowLeft size={16} />
                Voltar para Pacientes
            </button>
            
            <header className={styles.prontuarioHeader}>
                <h1>
                    <User size={26} />
                    Prontuário de {paciente.nome}
                </h1>
                <p>
                    <Phone size={14} />
                    Telefone: <strong>{paciente.telefone}</strong>
                </p>
                <p>
                    <Calendar size={14} />
                    Nascimento: {(paciente.data_nascimento || paciente.nascimento) ? new Date(paciente.data_nascimento || paciente.nascimento).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
            </header>

            <div className={styles.contentGrid}>
                {/* COLUNA 1: ADICIONAR NOTA */}
                <section className={styles.formSection}>
                    <h2>
                        <PlusCircle size={20} />
                        Nova Evolução
                    </h2>
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

                {/* COLUNA 2: HISTÓRICO */}
                <section className={styles.historySection}>
                    <h2>
                        <FileText size={20} />
                        Histórico de Notas ({notas.length})
                    </h2>
                    {notas.length === 0 ? (
                        <p className={styles.noNotesMessage}>Nenhuma nota de prontuário registrada ainda.</p>
                    ) : (
                        <div className={styles.notesList}>
                            {notas.map((nota) => (
                                <div key={nota.id} className={styles.noteCard}>
                                    <div className={styles.noteHeader}>
                                        <h3 className={styles.noteTitle}>{nota.titulo || 'Evolução Clínica'}</h3>
                                        <span className={styles.noteDate}>
                                            <Calendar size={13} />
                                            {formatarData(nota.data_nota)}
                                        </span>
                                    </div>
                                    <p className={styles.noteContent}>{nota.conteudo}</p>
                                    <p className={styles.noteAuthor}>
                                        <Stethoscope size={14} />
                                        Fisioterapeuta: <strong>{nota.nome_fisioterapeuta}</strong>
                                    </p>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handlePrintNota(nota)}
                                            className={styles.buttonPrint}
                                        >
                                            <Printer size={15} />
                                            Imprimir
                                        </button>
                                        <button 
                                            onClick={() => handleEditNota(nota)}
                                            className={styles.buttonEdit}
                                        >
                                            <Edit size={15} />
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            
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