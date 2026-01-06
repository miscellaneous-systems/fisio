import React, { useState, useEffect } from 'react';
import api from '../api/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import styles from './RelatoriosPage.module.css';

const RelatoriosPage = () => {
    // Estados para armazenar os dados vindos da API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [kpis, setKpis] = useState({
        totalAtendimentos: 0,
        faturamento: 0,
        pendentes: 0,
        taxaCancelamento: 0
    });
    
    const [dadosMensais, setDadosMensais] = useState([]);
    const [dadosStatus, setDadosStatus] = useState([]);

    // Busca os dados ao carregar a página
    useEffect(() => {
        const fetchRelatorios = async () => {
            try {
                setLoading(true);
                // ⚠️ Certifique-se de criar esta rota no seu backend ou ajustar para uma existente
                const response = await api.get('/relatorios/geral');
                const data = response.data;

                // Atualiza os estados com os dados do backend
                // Estrutura esperada do JSON: { kpis: {...}, evolucao_mensal: [...], status_distribuicao: [...] }
                setKpis({
                    totalAtendimentos: data.kpis?.total_atendimentos || 0,
                    faturamento: data.kpis?.faturamento || 0,
                    pendentes: data.kpis?.pendentes || 0,
                    taxaCancelamento: data.kpis?.taxa_cancelamento || 0
                });
                
                setDadosMensais(data.evolucao_mensal || []);
                setDadosStatus(data.status_distribuicao || []);
                setError(null);

            } catch (err) {
                console.error("Erro ao buscar dados de relatórios:", err);
                setError("Não foi possível carregar os indicadores. Verifique a conexão.");
            } finally {
                setLoading(false);
            }
        };

        fetchRelatorios();
    }, []);

    // Cores consistentes com o AgendamentosPage (Verde, Laranja, Vermelho)
    const COLORS = ['#2ecc71', '#f39c12', '#e74c3c'];

    // Formatação de Moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Relatórios e Métricas</h1>
                <p className={styles.subtitle}>Visão geral do desempenho da clínica</p>
            </header>

            {loading && <p style={{textAlign: 'center', padding: '20px'}}>Carregando métricas...</p>}
            {error && <p style={{textAlign: 'center', color: 'red', padding: '20px'}}>{error}</p>}

            {!loading && !error && (
            <>
            {/* KPI Cards - Indicadores Chave */}
            <div className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} ${styles.blue}`}>
                    <span className={styles.kpiLabel}>Total de Atendimentos</span>
                    <span className={styles.kpiValue}>{kpis.totalAtendimentos}</span>
                </div>
                <div className={`${styles.kpiCard} ${styles.green}`}>
                    <span className={styles.kpiLabel}>Faturamento Estimado</span>
                    <span className={styles.kpiValue}>{formatCurrency(kpis.faturamento)}</span>
                </div>
                <div className={`${styles.kpiCard} ${styles.orange}`}>
                    <span className={styles.kpiLabel}>Agendamentos Pendentes</span>
                    <span className={styles.kpiValue}>{kpis.pendentes}</span>
                </div>
                <div className={`${styles.kpiCard} ${styles.red}`}>
                    <span className={styles.kpiLabel}>Taxa de Cancelamento</span>
                    <span className={styles.kpiValue}>{kpis.taxaCancelamento}%</span>
                </div>
            </div>

            {/* Seção de Gráficos */}
            <div className={styles.chartsSection}>
                {/* Gráfico de Barras: Evolução Mensal */}
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartHeader}>Evolução Mensal</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={dadosMensais}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" />
                                <YAxis />
                                <Tooltip formatter={(value, name) => [
                                    name === 'faturamento' ? formatCurrency(value) : value, 
                                    name === 'faturamento' ? 'Faturamento' : 'Atendimentos'
                                ]} />
                                <Legend />
                                <Bar dataKey="atendimentos" fill="#3498db" name="Atendimentos" />
                                {/* Oculta a barra de faturamento se quiser focar só em atendimentos, ou mantém ambas */}
                                <Bar dataKey="faturamento" fill="#2ecc71" name="Faturamento" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pizza: Status */}
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartHeader}>Distribuição por Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dadosStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {dadosStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
};

export default RelatoriosPage;