import React, { useState, useEffect } from 'react';
import styles from './NotaFormModal.module.css';

const NotaFormModal = ({ isOpen, onClose, nota, onSave }) => {
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');

    // Atualiza os campos quando a nota muda ou o modal abre
    useEffect(() => {
        if (nota) {
            setTitulo(nota.titulo || '');
            setConteudo(nota.conteudo || '');
        }
    }, [nota]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Retorna o objeto atualizado mantendo o ID original
        onSave({ ...nota, titulo, conteudo });
    };

    return (
        <div className="modalOverlay"> {/* Classe global do index.css */}
            <div className="modalContent"> {/* Classe global do index.css */}
                <div className={styles.modalHeader}>
                    <h2>Editar Nota</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label className="formLabel">Título</label>
                    <input 
                        type="text" 
                        className="formInput" 
                        value={titulo} 
                        onChange={e => setTitulo(e.target.value)} 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label className="formLabel">Conteúdo</label>
                    <textarea 
                        className="formInput" 
                        style={{ minHeight: '150px', resize: 'vertical' }}
                        value={conteudo} 
                        onChange={e => setConteudo(e.target.value)} 
                    />
                </div>

                <button className={styles.submitButtonEdit} onClick={handleSubmit}>
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

export default NotaFormModal;