// src/pages/PacotesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PacoteBaseFormModal from '../components/PacoteBaseFormModal';
import VenderPacoteModal from '../components/VenderPacoteModal';
import api from '../api/api';
// ⚠️ Importa o arquivo de estilos
import styles from './PacotesPage.module.css'; 

const PacotesPage = () => {
    const { signed } = useAuth(); // Verifica se está autenticado
    
    // Estados para os dados
    const [modelosPacotes, setModelosPacotes] = useState([]);
    const [creditosAtivos, setCreditosAtivos] = useState([]); 
    
    // Estados para UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados do Modal de Cadastro/Edição
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [pacoteToEdit, setPacoteToEdit] = useState(null); 
    
    // Estado do Modal de Venda
    const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);

    // ----------------------------------------------------
    // FUNÇÕES DE BUSCA DE DADOS
    // ----------------------------------------------------
    
    const fetchModelosPacotes = async () => {
        try {
            const response = await api.get('/pacotes/base'); 
            setModelosPacotes(response.data.pacotes || []); 
        } catch (err) {
            console.error("Erro ao carregar modelos de pacotes:", err);
            setError("Falha ao carregar modelos de pacotes.");
        }
    };

    const fetchCreditosAtivos = async () => {
        try {
            const response = await api.get('/pacotes/vendidos'); 
            setCreditosAtivos(response.data.pacotes || []);
        } catch (err) {
            console.error("Erro ao carregar créditos ativos:", err);
            setError("Falha ao carregar pacotes ativos dos pacientes.");
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        await fetchModelosPacotes();
        await fetchCreditosAtivos();
        setLoading(false);
    };

    useEffect(() => {
        if (signed) {
            loadData();
        }
    }, [signed]);

    // ----------------------------------------------------
    // FUNÇÕES DE AÇÃO
    // ----------------------------------------------------

    const handleOpenCreateModal = () => {
        setPacoteToEdit(null); 
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (pacote) => {
        setPacoteToEdit(pacote); 
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setPacoteToEdit(null);
    };

    const handleOpenVendaModal = () => {
        setIsVendaModalOpen(true);
    };

    const handleCloseVendaModal = () => {
        setIsVendaModalOpen(false);
    };

    const handleSaveAndReload = () => {
        handleCloseFormModal();
        handleCloseVendaModal();
        loadData();
    };

    const handleDeleteModelo = async (pacoteId) => {
        if (window.confirm("Tem certeza que deseja deletar este Modelo de Pacote? Esta ação é irreversível.")) {
            try {
                await api.delete(`/pacotes/base/${pacoteId}`);
                alert("Modelo de Pacote deletado com sucesso!");
                loadData();
            } catch (err) {
                console.error("Erro ao deletar pacote:", err.response || err);
                const mensagem = err.response?.data?.message || "Falha ao deletar o modelo.";
                if (err.response?.status === 404) {
                    alert(`Erro 404: A rota DELETE /pacotes/base/${pacoteId} não foi encontrada no servidor.\n\nVerifique se o backend tem esta rota implementada.`);
                } else {
                    alert(mensagem);
                }
                setError(mensagem);
            }
        }
    };

    const handleDeleteCredito = async (creditoId) => {
        if (window.confirm("Tem certeza que deseja CANCELAR este Pacote Ativo? Isso removerá o saldo de sessões do paciente.")) {
            try {
                await api.delete(`/pacotes/ativos/${creditoId}`);
                alert("Crédito ativo cancelado com sucesso!");
                loadData();
            } catch (err) {
                console.error("Erro ao cancelar crédito:", err.response || err);
                setError(err.response?.data?.message || "Falha ao cancelar o crédito ativo.");
            }
        }
    };
    
    // ----------------------------------------------------
    // RENDERIZAÇÃO
    // ----------------------------------------------------

    if (!signed) {
        return <div className={styles.container}><p className={styles.errorMessage}>Erro: Você precisa estar autenticado. Faça login para continuar.</p></div>;
    }

    if (loading) return <div className={styles.container}><p className={styles.loadingMessage}>Carregando dados dos pacotes...</p></div>;
    if (error) return <div className={styles.container}><p className={styles.errorMessage}>Erro: {error}</p></div>;

    return (
        <div className={styles.container}>
            <h1>Gestão de Pacotes e Créditos</h1>
            
            <div className={styles.header}>
                <button 
                    onClick={handleOpenVendaModal} 
                    className={`${styles.button} ${styles.buttonPrimary}`}
                >
                    Vender Novo Pacote
                </button>
                <button 
                    onClick={handleOpenCreateModal} 
                    className={`${styles.button} ${styles.buttonSecondary}`}
                >
                    + Novo Modelo Base
                </button>
            </div>

            {/* Créditos Ativos (Pacotes Vendidos) */}
            <div className={styles.section}>
                <h2>✅ Créditos Ativos (Pacientes)</h2>
                {creditosAtivos?.length === 0 ? (
                    <p className={styles.infoMessage}>Nenhum pacote ativo encontrado.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableCell}>Paciente</th>
                                <th className={styles.tableCell}>Modelo</th>
                                <th className={styles.tableCell}>Valor Pago</th>
                                <th className={`${styles.tableCell} ${styles.tableCenter}`}>Saldo</th>
                                <th className={styles.tableCell}>Validade</th>
                                <th className={styles.tableCell}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditosAtivos?.map((pacoteAtivo) => ( 
                                <tr key={pacoteAtivo.id}>
                                    <td className={styles.tableCell}>{pacoteAtivo.nome_paciente}</td>
                                    <td className={styles.tableCell}>{pacoteAtivo.nome_pacote} ({pacoteAtivo.total_sessoes} sessões)</td>
                                    <td className={styles.tableCell}>R$ {parseFloat(pacoteAtivo.valor_total_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={`${styles.tableCell} ${styles.tableCenter}`}>
                                        {/* Aplica a classe condicionalmente */}
                                        <span className={pacoteAtivo.sessoes_restantes > 0 ? styles.saldoPositivo : styles.saldoNegativo}>
                                            {pacoteAtivo.sessoes_restantes}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        {pacoteAtivo.data_vencimento ? new Date(pacoteAtivo.data_vencimento).toLocaleDateString() : 'Sem Limite'}
                                    </td>
                                    <td className={`${styles.tableCell} ${styles.actionCell}`}>
                                        <div className="table-actions">
                                            <button 
                                                onClick={() => handleDeleteCredito(pacoteAtivo.id)} 
                                                className={`${styles.actionButton} ${styles.buttonDelete}`}
                                            >
                                                Cancelar
                                            </button>
                                            {/* Futuramente: Botão de Registrar Sessão */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <hr className={styles.hr} />

            {/* Modelos Base (Catálogo) */}
            <div className={styles.section}>
                <h2>📚 Modelos de Pacotes Base (Catálogo)</h2>
                {modelosPacotes?.length === 0 ? (
                    <p className={styles.infoMessage}>Nenhum modelo de pacote base cadastrado.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableCell}>Nome</th>
                                <th className={styles.tableCell}>Sessões</th>
                                <th className={styles.tableCell}>Valor Base</th>
                                <th className={styles.tableCell}>Prazo (dias)</th>
                                <th className={styles.tableCell}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modelosPacotes?.map((modelo) => (
                                <tr key={modelo.id}>
                                    <td className={styles.tableCell}>{modelo.nome}</td>
                                    <td className={styles.tableCell}>{modelo.total_sessoes}</td> 
                                    <td className={styles.tableCell}>R$ {parseFloat(modelo.valor_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className={styles.tableCell}>{modelo.duracao_dias === 0 ? 'Ilimitado' : modelo.duracao_dias}</td>
                                    <td className={`${styles.tableCell} ${styles.actionCell}`}>
                                        <div className="table-actions">
                                            <button 
                                                onClick={() => handleOpenEditModal(modelo)} 
                                                className={`${styles.actionButton} ${styles.buttonEdit}`}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteModelo(modelo.id)} 
                                                className={`${styles.actionButton} ${styles.buttonDanger}`}
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Cadastro/Edição de Pacote Base */}
            <PacoteBaseFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveAndReload}
                pacote={pacoteToEdit}
            />

            {/* Modal de Venda de Pacote */}
            <VenderPacoteModal
                isOpen={isVendaModalOpen}
                onClose={handleCloseVendaModal}
                onVenda={handleSaveAndReload}
                modelosPacotes={modelosPacotes}
            />
        </div>
    );
};

export default PacotesPage;