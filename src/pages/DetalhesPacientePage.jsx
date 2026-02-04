// src/pages/DetalhesPacientePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
// ⚠️ Importa o arquivo de estilos
import styles from './DetalhesPacientePage.module.css';

const DetalhesPacientePage = () => {
    const navigate = useNavigate();
    // Captura o 'id' da URL (definido na rota /pacientes/:id)
    const { id } = useParams();
    
    // 1. Estados
    const [paciente, setPaciente] = useState(null);
    const [pacotesAtivos, setPacotesAtivos] = useState([]);
    const [evolucoes, setEvolucoes] = useState([]); // Histórico de evoluções/sessões
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 2. Função de Busca de Dados
    const fetchDetalhesPaciente = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/pacientes/${id}`);
            const data = response.data;
            
            setPaciente(data.paciente || {});
            setPacotesAtivos(data.pacotes_ativos || []);
            setEvolucoes(data.evolucoes || []);

        } catch (err) {
            console.error("Erro ao carregar detalhes do paciente:", err.response || err);
            setError('Não foi possível carregar o prontuário. Paciente não encontrado ou erro de servidor.');
        } finally {
            setLoading(false);
        }
    };
    
    // 3. Efeito para carregar dados na montagem do componente
    useEffect(() => {
        if (id) {
            fetchDetalhesPaciente();
        }
    }, [id]);

    // Funções Auxiliares de Formatação
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'N/A';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Componente de carregamento e erro
    if (loading) {
        return <div className={styles.centeredMessage} role="status">Carregando Prontuário...</div>;
    }

    if (error) {
        return <h2 className={styles.error}>{error}</h2>;
    }
    
    // 4. Renderização
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Prontuário: {paciente?.nome}</h1>
                <p className={styles.subtitle}>
                    ID: <strong>{paciente?.id}</strong> | CPF: {paciente?.cpf || 'N/A'} | Contato: {paciente?.telefone || 'N/A'}
                </p>
            </div>

            {/* --- SEÇÃO 1: PACOTES E CRÉDITOS ATIVOS --- */}
            <section className={styles.section}>
                <h2 className={styles.h2}>💳 Pacotes e Créditos Ativos</h2>
                {pacotesAtivos.length === 0 ? (
                    <p className={styles.info}>Nenhum pacote ativo registrado. Sugerir a compra de um pacote.</p>
                ) : (
                    <div className={styles.cardGrid}>
                        {pacotesAtivos.map(pacote => {
                            const remainingSessions = pacote.sessoes_restantes;
                            const badgeClass = remainingSessions < 3 ? 'remaining-badge-low' : 'remaining-badge-ok';
                            
                            return (
                                <div key={pacote.id} className={styles.card}>
                                    <h3 className={styles.cardTitle}>{pacote.pacote_nome}</h3>
                                    <p className={styles.cardDetail}>
                                        Sessões Iniciais: <strong>{pacote.sessoes_iniciais}</strong>
                                    </p>
                                    <p className={styles.cardDetail}>
                                        Restantes: 
                                        <span className={`${styles.remainingBadge} ${styles[badgeClass]}`}>
                                            {remainingSessions}
                                        </span>
                                    </p>
                                    <p className={styles.cardDetail}>
                                        Valor Pago: {formatCurrency(pacote.valor || 0)}
                                    </p>
                                    <p className={styles.cardDate}>
                                        Comprado em: {new Date(pacote.data_compra).toLocaleDateString()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
            
            <hr className={styles.hr} />

            {/* --- SEÇÃO 2: DADOS PESSOAIS --- */}
            <section className={styles.section}>
                <h2 className={styles.h2}>🧑‍🤝‍ Prontuário Base</h2>
                <div className={styles.detailsGrid}>
                    <p><strong>E-mail:</strong> {paciente?.email || 'N/A'}</p>
                    <p><strong>Nascimento:</strong> {(paciente?.data_nascimento || paciente?.nascimento) ? new Date(paciente.data_nascimento || paciente.nascimento).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Endereço:</strong> {paciente?.endereco || 'N/A'}</p>
                    <p><strong>Profissão:</strong> {paciente?.profissao || 'N/A'}</p>
                    {/* A estilização para span 2 será feita no CSS */}
                    <p className={styles.queixaPrincipal}><strong>Queixa Principal:</strong> {paciente?.queixa_principal || 'Nenhuma queixa registrada.'}</p>
                </div>
            </section>
            
            <hr className={styles.hr} />

            {/* --- SEÇÃO 3: HISTÓRICO DE EVOLUÇÕES (SESSÕES) --- */}
            <section className={styles.section}>
                <h2 className={styles.h2}>🗓️ Histórico de Sessões e Evoluções</h2>
                {evolucoes.length === 0 ? (
                    <p className={styles.info}>Nenhuma sessão registrada para este paciente.</p>
                ) : (
                    <div className={styles.evolutionContainer}>
                        {evolucoes.map(evolucao => (
                            <div key={evolucao.id} className={styles.evolutionCard}>
                                <div className={styles.evolutionHeader}>
                                    <span className={styles.evolutionDate}>
                                        {new Date(evolucao.data_hora).toLocaleDateString()} às {new Date(evolucao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={styles.evolutionStatus}>{evolucao.status || 'Pendente'}</span>
                                </div>
                                <p className={styles.evolutionDetail}>
                                    <strong>Tipo:</strong> {evolucao.tipo_sessao || 'Fisioterapia'}
                                </p>
                                <p className={styles.evolutionText}>
                                    {evolucao.evolucao_texto || evolucao.observacoes || 'Nenhuma evolução detalhada registrada.'}
                                </p>
                                <button onClick={() => navigate(`/prontuario/${id}`)} className={styles.evolutionButton}>
                                    Editar/Adicionar Evolução
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default DetalhesPacientePage;