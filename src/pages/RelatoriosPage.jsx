import React, { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./RelatoriosPage.module.css";

const RelatoriosPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({
    totalAtendimentos: 0,
    faturamento: 0,
    pendentes: 0,
    taxaCancelamento: 0,
  });

  const [dadosMensais, setDadosMensais] = useState([]);
  const [dadosStatus, setDadosStatus] = useState([]);

  useEffect(() => {
    const fetchRelatorios = async () => {
      try {
        const response = await api.get("/relatorios/geral");
        const data = response.data;

        setKpis({
          totalAtendimentos: data.kpis?.total_atendimentos || 0,
          faturamento: data.kpis?.faturamento || 0,
          pendentes: data.kpis?.pendentes || 0,
          taxaCancelamento: data.kpis?.taxa_cancelamento || 0,
        });

        setDadosMensais(data.evolucao_mensal || []);
        setDadosStatus(
          (data.status_distribuicao || []).map((item) => ({
            name: item.name,
            value: Number(item.value),
          })),
        );
        setError(null);
      } catch (err) {
        setError("Erro ao carregar relatórios");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatorios();
  }, []);

  /* TRANSFORMA OS DADOS DO STATUS PARA O PADRÃO DO RECHARTS */
  const dadosStatusFormatados = useMemo(() => {
    return dadosStatus.map((item) => ({
      name: item.status || item.name,
      value: item.total || item.value,
    }));
  }, [dadosStatus]);

  const COLORS = ["#2ecc71", "#f39c12", "#e74c3c", "#3498db"];

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) {
    return <div className={styles.centeredMessage} role="status">Carregando relatórios...</div>;
  }

  if (error) {
    return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios e Métricas</h1>
        <p className={styles.subtitle}>Visão geral do desempenho da clínica</p>
      </header>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.blue}`}>
          <span className={styles.kpiLabel}>Total de Atendimentos</span>
          <span className={styles.kpiValue}>{kpis.totalAtendimentos}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.green}`}>
          <span className={styles.kpiLabel}>Faturamento</span>
          <span className={styles.kpiValue}>
            {formatCurrency(kpis.faturamento)}
          </span>
        </div>
        <div className={`${styles.kpiCard} ${styles.orange}`}>
          <span className={styles.kpiLabel}>Pendentes</span>
          <span className={styles.kpiValue}>{kpis.pendentes}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.red}`}>
          <span className={styles.kpiLabel}>Cancelamento</span>
          <span className={styles.kpiValue}>{kpis.taxaCancelamento}%</span>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className={styles.chartsSection}>
        {/* Barras */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartHeader}>Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="atendimentos" fill="#3498db" />
              <Bar dataKey="faturamento" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIZZA */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartHeader}>Distribuição por Status</h3>

          {dadosStatusFormatados.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosStatusFormatados}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {dadosStatusFormatados.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center" }}>
              Nenhum dado de status disponível
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;
