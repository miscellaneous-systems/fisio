import React, { useState } from 'react';
import styles from './AtendimentoModal.module.css';

const AtendimentoModal = ({ isOpen, onClose, onSave, pacienteNome }) => {
    const [mode, setMode] = useState('menu'); // 'menu', 'avaliacao', 'evolucao'
    
    // Estados para Avaliação
    const [avaliacaoData, setAvaliacaoData] = useState({ queixa: '', hma: '', exame: '', diagnostico: '' });
    
    // Estados para Evolução
    const [evolucaoData, setEvolucaoData] = useState({ relato: '', conduta: '' });

    if (!isOpen) return null;

    // Funções auxiliares para gerar o conteúdo formatado (Reutilizado para Salvar e Imprimir)
    const getAvaliacaoContent = () => `
[AVALIAÇÃO INICIAL]
Queixa Principal: ${avaliacaoData.queixa}
HMA: ${avaliacaoData.hma}
Exame Físico: ${avaliacaoData.exame}
Diagnóstico/Hipótese: ${avaliacaoData.diagnostico}
    `.trim();

    const getEvolucaoContent = () => `
[EVOLUÇÃO DE SESSÃO]
Relato: ${evolucaoData.relato}
Conduta: ${evolucaoData.conduta}
    `.trim();

    const handleSaveAvaliacao = () => {
        onSave('Avaliação Inicial', getAvaliacaoContent());
    };

    const handleSaveEvolucao = () => {
        onSave('Evolução de Sessão', getEvolucaoContent());
    };

    // Lógica de Impressão
    const handlePrint = (titulo, conteudo) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir - ${titulo}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .meta { margin-bottom: 20px; color: #555; }
                        .content { white-space: pre-wrap; line-height: 1.6; font-size: 14px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                        .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>${titulo}</h1>
                    <div class="meta">
                        <strong>Paciente:</strong> ${pacienteNome}<br>
                        <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
                    </div>
                    <div class="content">${conteudo}</div>
                    <div class="footer">Documento gerado pelo sistema FisioApp</div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Atendimento: {pacienteNome}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <div className={styles.body}>
                    {mode === 'menu' && (
                        <div className={styles.menuOptions}>
                            <p className={styles.instruction}>Selecione o tipo de registro para iniciar:</p>
                            <button className={`${styles.menuBtn} ${styles.btnAvaliacao}`} onClick={() => setMode('avaliacao')}>
                                📋 Iniciar Avaliação
                                <span>Anamnese, Exame Físico, Diagnóstico</span>
                            </button>
                            <button className={`${styles.menuBtn} ${styles.btnEvolucao}`} onClick={() => setMode('evolucao')}>
                                📈 Iniciar Evolução
                                <span>Relato da Sessão, Conduta</span>
                            </button>
                        </div>
                    )}

                    {mode === 'avaliacao' && (
                        <div className={styles.formContainer}>
                            <h3>Ficha de Avaliação</h3>
                            <div className={styles.formGroup}>
                                <label>Queixa Principal</label>
                                <textarea value={avaliacaoData.queixa} onChange={e => setAvaliacaoData({...avaliacaoData, queixa: e.target.value})} placeholder="O que trouxe o paciente aqui?" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>História da Moléstia Atual (HMA)</label>
                                <textarea value={avaliacaoData.hma} onChange={e => setAvaliacaoData({...avaliacaoData, hma: e.target.value})} placeholder="Histórico do problema..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Exame Físico / Observações</label>
                                <textarea value={avaliacaoData.exame} onChange={e => setAvaliacaoData({...avaliacaoData, exame: e.target.value})} placeholder="Achados clínicos..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Diagnóstico / Hipótese</label>
                                <input type="text" value={avaliacaoData.diagnostico} onChange={e => setAvaliacaoData({...avaliacaoData, diagnostico: e.target.value})} className={styles.input} />
                            </div>

                            <div className={styles.actions}>
                                <button onClick={() => setMode('menu')} className={styles.backBtn}>Voltar</button>
                                <div className={styles.rightActions}>
                                    <button 
                                        onClick={() => handlePrint('Avaliação Inicial', getAvaliacaoContent())} 
                                        className={styles.printBtn}
                                    >
                                        🖨️ Imprimir
                                    </button>
                                    <button onClick={handleSaveAvaliacao} className={styles.saveBtn}>Salvar Avaliação</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'evolucao' && (
                        <div className={styles.formContainer}>
                            <h3>Registro de Evolução</h3>
                            <div className={styles.formGroup}>
                                <label>Relato do Atendimento</label>
                                <textarea rows="6" value={evolucaoData.relato} onChange={e => setEvolucaoData({...evolucaoData, relato: e.target.value})} placeholder="Como o paciente reagiu? O que foi feito?" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Conduta / Próximos Passos</label>
                                <textarea rows="3" value={evolucaoData.conduta} onChange={e => setEvolucaoData({...evolucaoData, conduta: e.target.value})} placeholder="Orientações para casa ou plano para próxima sessão..." />
                            </div>

                            <div className={styles.actions}>
                                <button onClick={() => setMode('menu')} className={styles.backBtn}>Voltar</button>
                                <div className={styles.rightActions}>
                                    <button 
                                        onClick={() => handlePrint('Evolução de Sessão', getEvolucaoContent())} 
                                        className={styles.printBtn}
                                    >
                                        🖨️ Imprimir
                                    </button>
                                    <button onClick={handleSaveEvolucao} className={styles.saveBtn}>Salvar Evolução</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AtendimentoModal;