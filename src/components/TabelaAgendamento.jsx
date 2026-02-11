import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './TabelaAgendamento.css';
import api from '../api/api'; // Importação da instância do Axios configurada
import AtendimentoModal from './AtendimentoModal';

const HORARIOS_PADRAO = [
  '07:00', '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const DIAS_SEMANA = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' }
];

export default function TabelaAgendamento({ dias = DIAS_SEMANA, horarios = HORARIOS_PADRAO }) {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(new Date()); // Data base para navegação

  // Estados para o Modal de Agendamento
  const [modalAberto, setModalAberto] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState(null); // { key, diaKey, horario }
  
  // Estados do Formulário dentro do Modal
  const [nomePaciente, setNomePaciente] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null); // { id, nome }
  const [sugestoes, setSugestoes] = useState([]); // Lista de pacientes para busca
  const [modoCriacao, setModoCriacao] = useState('existente'); // 'existente' ou 'novo'
  const [novoPacienteDados, setNovoPacienteDados] = useState({ nome: '', telefone: '', email: '', data_nascimento: '' });
  const [tipoSessao, setTipoSessao] = useState('Fisioterapia'); // Estado para o tipo de sessão
  const [mobileDayIndex, setMobileDayIndex] = useState(0); // Índice do dia selecionado no mobile
  const [atendimentoModalOpen, setAtendimentoModalOpen] = useState(false); // Estado do Modal de Atendimento
  const [agendamentoEmAtendimento, setAgendamentoEmAtendimento] = useState(null); // Agendamento selecionado para atendimento

  // Função para formatar data (exibição)
  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // --- INTEGRAÇÃO COM API ---

  // Função auxiliar para mapear dados da API para o formato da tabela visual
  // Assumindo que a API retorna algo como: [{ id, data_hora, paciente: { nome, id }, status }, ...]
  const carregarAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date(dataReferencia);
      hoje.setHours(0, 0, 0, 0);
      const diaAtual = hoje.getDay();
      const inicioSemana = new Date(hoje);
      // Ajusta para o início da semana (domingo)
      inicioSemana.setDate(hoje.getDate() - diaAtual);

      // Array para guardar as requisições para cada dia da semana
      const promessas = [];
      for (let i = 0; i < 7; i++) {
        const diaCorrente = new Date(inicioSemana);
        diaCorrente.setDate(inicioSemana.getDate() + i);
        const diaFormatado = diaCorrente.toISOString().split('T')[0];
        
        // A rota /agendamentos/dia, usada em outras partes do app, retorna o paciente_id
        promessas.push(api.get('/agendamentos/dia', { params: { data: diaFormatado } }));
      }

      // Executa todas as requisições em paralelo
      const results = await Promise.allSettled(promessas);
      
      const mapaAgendamentos = {};
      
      // Processa a resposta de cada dia
      results.forEach(result => {
        // Se a requisição falhou, ignoramos apenas aquele dia, mantendo o resto da agenda
        if (result.status !== 'fulfilled') return;

        const listaDoDia = result.value.data.agendamentos || [];
        listaDoDia.forEach(agendamento => {
          const dataObj = new Date(agendamento.data_hora);
          
          const diasKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
          const diaKey = diasKeys[dataObj.getDay()];
          const hora = dataObj.getHours().toString().padStart(2, '0') + ':00';
          
          const key = `${diaKey}-${hora}`;

          if (!mapaAgendamentos[key]) {
            mapaAgendamentos[key] = [];
          }
          
          // Adiciona o agendamento ao mapa, agora com o paciente_id correto
          mapaAgendamentos[key].push({
            id: agendamento.id,
            paciente_id: agendamento.paciente_id || agendamento.paciente?.id || agendamento.pacienteId,
            nome_paciente: agendamento.nome_paciente || 'Sem Nome',
            servico_tipo: agendamento.servico_tipo, 
            status: agendamento.status || 'Pendente',
            observacoes: agendamento.observacoes,
            data_hora: agendamento.data_hora // Necessário para a duplicação
          });
        });
      });

      setAgendamentos(mapaAgendamentos);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      // Fallback para não quebrar a tela se a API falhar
    } finally {
      setLoading(false);
    }
  }, [dataReferencia]);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  // Define o dia inicial no mobile (baseado no dia da semana atual)
  useEffect(() => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
// Mapeia: Dom(0)->0(Seg), Seg(1)->0(Seg), ..., Sab(6)->5(Sab)
    let index = diaSemana === 0 ? 0 : diaSemana - 1;
    if (index >= dias.length) index = 0;
    setMobileDayIndex(index);
  }, [dias.length]);

  // Navegação de Datas
  const semanaAnterior = () => {
    const novaData = new Date(dataReferencia);
    novaData.setDate(novaData.getDate() - 7);
    setDataReferencia(novaData);
  };

  const proximaSemana = () => {
    const novaData = new Date(dataReferencia);
    novaData.setDate(novaData.getDate() + 7);
    setDataReferencia(novaData);
  };

  const irParaHoje = () => {
    setDataReferencia(new Date());
  };

  // Função para mudar a data via input (Date Picker)
  const handleDataChange = (e) => {
    const dataValue = e.target.value;
    if (dataValue) {
      const [ano, mes, dia] = dataValue.split('-').map(Number);
      // Cria a data preservando o dia selecionado (evita problemas de fuso horário)
      const novaData = new Date(ano, mes - 1, dia);
      setDataReferencia(novaData);
    }
  };

  // Helper para formatar a data atual para o value do input (YYYY-MM-DD)
  const getDataISO = () => {
    const d = new Date(dataReferencia);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  // Helper para calcular a data correta baseada no dia da semana da tabela
  const getDataParaDiaSemana = (diaKey, horarioStr) => {
    const diasMap = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
    const targetDiaIndex = diasMap[diaKey];
    
    // Usa dataReferencia em vez de new Date() para respeitar a semana visualizada
    const hoje = new Date(dataReferencia);
    hoje.setHours(0, 0, 0, 0); // Zera a hora para evitar erros de cálculo de dias
    const diaAtualIndex = hoje.getDay();
    
    const diff = targetDiaIndex - diaAtualIndex; // Diferença de dias
    const dataAlvo = new Date(hoje);
    dataAlvo.setDate(hoje.getDate() + diff); // Ajusta para o dia da semana correto na semana atual
    const [horas, minutos] = horarioStr.split(':').map(Number);
    dataAlvo.setHours(horas, minutos, 0, 0);
    return dataAlvo;
  };

  const abrirModal = (diaKey, horario) => {
    // Validação: Impedir agendamento em dias passados
    const dataAlvo = getDataParaDiaSemana(diaKey, horario);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataComparacao = new Date(dataAlvo);
    dataComparacao.setHours(0, 0, 0, 0);
    if (dataComparacao < hoje) {
      alert("Não é permitido realizar agendamentos em datas passadas.");
      return;
    }

    const key = `${diaKey}-${horario}`;
    setSlotSelecionado({ key, diaKey, horario });
    setNomePaciente('');
    setPacienteSelecionado(null);
    setSugestoes([]);
    setModoCriacao('existente');
    setNovoPacienteDados({ nome: '', telefone: '', email: '', data_nascimento: '' });
    setTipoSessao('Fisioterapia'); // Reseta o tipo de sessão ao abrir
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setSlotSelecionado(null);
  };

  // Função de Busca de Pacientes
  const handleBuscaPaciente = async (termo) => {
    setNomePaciente(termo);
    setPacienteSelecionado(null); // Limpa seleção se o usuário alterar o texto

    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }

    try {
      // Tenta buscar filtrando (ajuste conforme sua API: ?nome= ou ?q=)
      // Se a API não tiver filtro, buscamos todos e filtramos no front (menos performático mas funcional)
      const response = await api.get('/pacientes'); 
      
      // CORREÇÃO: Garante que pegamos a lista correta, seja array direto ou objeto { pacientes: [] }
      const listaPacientes = response.data.pacientes || response.data || [];
      
      if (Array.isArray(listaPacientes)) {
        const filtrados = listaPacientes.filter(p => 
          p.nome && p.nome.toLowerCase().includes(termo.toLowerCase())
        );
        setSugestoes(filtrados.slice(0, 5)); // Limita a 5 sugestões
      }
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  };

  const selecionarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    setNomePaciente(paciente.nome);
    setSugestoes([]);
  };

  // Função para formatar a data no cabeçalho (ex: 02/02/2026)
  const formatarDataCabecalho = (diaKey) => {
    const diasMap = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
    const targetDiaIndex = diasMap[diaKey];
    
    const hoje = new Date(dataReferencia);
    hoje.setHours(0, 0, 0, 0);
    const diaAtualIndex = hoje.getDay();
    
    const diff = targetDiaIndex - diaAtualIndex;
    const dataAlvo = new Date(hoje);
    dataAlvo.setDate(hoje.getDate() + diff);
    
    return dataAlvo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Adicionar Agendamento (Paciente Existente ou Novo)
  const handleAdicionarAgendamento = async (e) => {
    e.preventDefault();
    
    try {
      let pacienteIdFinal = null;
      let nomeFinal = '';

      if (modoCriacao === 'novo') {
        // 1. Criar Paciente Primeiro
        const resPaciente = await api.post('/pacientes', novoPacienteDados);
        // CORREÇÃO: Verifica se o paciente vem dentro de uma propriedade 'paciente' ou direto no data
        const pacienteCriado = resPaciente.data.paciente || resPaciente.data;
        pacienteIdFinal = pacienteCriado.id;
        nomeFinal = pacienteCriado.nome;
      } else {
        // 2. Usar Paciente Existente (Lógica simplificada: busca por nome ou ID simulado)
        // Num app real, isso seria um Select/Autocomplete com ID
        if (!pacienteSelecionado) {
          alert("Por favor, selecione um paciente da lista de sugestões para garantir o vínculo do ID.");
          return;
        }
        
        pacienteIdFinal = pacienteSelecionado.id;
        nomeFinal = pacienteSelecionado.nome;
      }

// 3. Criar o Agendamento
      // Calcula a data ISO completa para o backend
      const dataHoraISO = getDataParaDiaSemana(slotSelecionado.diaKey, slotSelecionado.horario).toISOString();

      const payload = {
        paciente_id: pacienteIdFinal, // Obrigatório
        data_hora: dataHoraISO, // Envia data completa (ISO)
        status: 'Pendente',
        servico_tipo: tipoSessao,
        duracao_minutos: 60, // Padrão de 1 hora
        observacoes: ''
      };

      await api.post('/agendamentos', payload);
      
      // Recarrega a lista
      await carregarAgendamentos();
      
      // Limpa campos
      setNomePaciente('');
      setNovoPacienteDados({ nome: '', telefone: '', email: '', data_nascimento: '' });
      setModoCriacao('existente');

    } catch (error) {
      alert('Erro ao criar agendamento: ' + (error.response?.data?.message || error.message));
    }
  };

  // Atualizar Status (Ex: Realizado, Cancelado)
  const handleStatusChange = async (agendamentoId, novoStatus, motivo = '') => {
    try {
      // Se for concluir, usa a rota específica para garantir débito de pacote e consistência
      if (novoStatus === 'Realizado') {
        await api.put(`/agendamentos/${agendamentoId}/concluir`, { status: 'Realizado' });
      } else {
        // Busca os dados completos antes de atualizar para evitar erro de campos obrigatórios
        const response = await api.get(`/agendamentos/${agendamentoId}`);
        const agendamentoAtual = response.data.agendamento;

        const payload = { 
          ...agendamentoAtual, 
          status: novoStatus 
        };

        // Se for um cancelamento e um motivo foi fornecido, adiciona nas observações
        if (novoStatus === 'Cancelado' && motivo) {
          // Prepend o motivo para não sobrescrever observações existentes
          const obsOriginal = agendamentoAtual.observacoes ? ` | Obs. Original: ${agendamentoAtual.observacoes}` : '';
          payload.observacoes = `Cancelado: ${motivo}${obsOriginal}`;
        }

        await api.put(`/agendamentos/${agendamentoId}`, payload);
      }
      carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao atualizar status", error);
      alert("Erro ao atualizar status: " + (error.response?.data?.message || error.message));
    }
  };

  // Remover Agendamento
  const handleRemover = async (agendamentoId) => {
    if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
      try {
        await api.delete(`/agendamentos/${agendamentoId}`);
        carregarAgendamentos();
      } catch (error) {
        alert("Erro ao remover");
      }
    }
  };

  // --- Drag and Drop ---
  const handleDragStart = (e, agendamentoId) => {
    e.dataTransfer.setData("agendamentoId", agendamentoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, diaKey, horario) => {
    e.preventDefault();
    const agendamentoId = e.dataTransfer.getData("agendamentoId");
    
    if (!agendamentoId) return;
    
    try {
      // 1. Busca os detalhes completos do agendamento para não perder dados no update.
      const response = await api.get(`/agendamentos/${agendamentoId}`);
      const agendamentoCompleto = response.data.agendamento;

      if (!agendamentoCompleto) {
        alert("Erro: Não foi possível encontrar os dados originais do agendamento.");
        return;
      }

      // 2. Calcula a nova data e prepara a confirmação
      const novaDataHora = getDataParaDiaSemana(diaKey, horario);
      const diaLabel = dias.find(d => d.key === diaKey)?.label || diaKey;

      if (window.confirm(`Deseja mover o agendamento de '${agendamentoCompleto.nome_paciente}' para ${diaLabel} às ${horario}?`)) {
        // 3. Prepara o payload completo para o PUT, atualizando apenas a data/hora
        const payloadCompleto = {
          ...agendamentoCompleto,
          data_hora: novaDataHora.toISOString()
        };
        await api.put(`/agendamentos/${agendamentoId}`, payloadCompleto);
        carregarAgendamentos();
      }
    } catch (error) {
      alert("Erro ao mover agendamento: " + (error.response?.data?.message || error.message));
    }
  };

  // --- Lógica de Atendimento (Modal) ---
  const handleAbrirAtendimento = (agendamento) => {
    if (!agendamento.paciente_id) {
      alert("Erro: Este agendamento não tem um paciente vinculado corretamente.");
      return;
    }
    setAgendamentoEmAtendimento(agendamento);
    setAtendimentoModalOpen(true);
  };

  const handleSaveAtendimento = async (titulo, conteudo) => {
    if (!agendamentoEmAtendimento) return;
    
    try {
      await api.post('/prontuario', {
        paciente_id: agendamentoEmAtendimento.paciente_id,
        titulo: titulo,
        conteudo: conteudo
      });
      alert(`${titulo} salva com sucesso!`);
      setAtendimentoModalOpen(false);
      setAgendamentoEmAtendimento(null);
    } catch (error) {
      console.error("Erro ao salvar atendimento:", error);
      alert("Erro ao salvar o registro. Tente novamente.");
    }
  };

  // Helper para pegar a lista atual dentro do render
  const getAgendamentosSlot = (key) => agendamentos[key] || [];

  // Cálculo para exibir o intervalo no cabeçalho
  const getIntervaloExibicao = () => {
    const d = new Date(dataReferencia);
    const dia = d.getDay();
    const inicio = new Date(d);
    inicio.setDate(d.getDate() - dia);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return `${formatarData(inicio)} a ${formatarData(fim)}`;
  };

  // Função para gerar e imprimir a visualização da semana
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // Prepara os cabeçalhos com datas
    const headers = dias.map(dia => ({
      label: dia.label,
      data: formatarDataCabecalho(dia.key)
    }));

    const intervalo = getIntervaloExibicao();

    let htmlContent = `
      <html>
        <head>
          <title>Agenda Semanal - ${intervalo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; margin-bottom: 10px; font-size: 1.5rem; }
            .subtitle { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: center; vertical-align: top; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .time-col { background-color: #fafafa; font-weight: bold; width: 50px; }
            .paciente-card { 
              background: #e3f2fd; border: 1px solid #90caf9; 
              border-radius: 4px; padding: 4px; margin-bottom: 4px; text-align: left; 
            }
            .paciente-card.cancelado { background: #ffebee; border-color: #ef9a9a; text-decoration: line-through; color: #c62828; }
            .paciente-card.realizado { background: #e8f5e9; border-color: #a5d6a7; }
            .p-nome { font-weight: bold; display: block; }
            .p-servico { font-size: 0.9em; color: #555; }
            @media print { @page { size: landscape; } }
          </style>
        </head>
        <body>
          <h1>Agenda Semanal</h1>
          <div class="subtitle">${intervalo}</div>
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                ${headers.map(h => `<th>${h.label}<br><small>${h.data}</small></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${horarios.map(horario => `
                <tr>
                  <td class="time-col">${horario}</td>
                  ${dias.map(dia => {
                    const key = `${dia.key}-${horario}`;
                    const lista = agendamentos[key] || [];
                    return `<td>${lista.map(p => `
                      <div class="paciente-card ${p.status === 'Cancelado' ? 'cancelado' : p.status === 'Realizado' ? 'realizado' : ''}">
                        <span class="p-nome">${p.nome_paciente}</span>
                        <span class="p-servico">${p.servico_tipo}</span>
                      </div>
                    `).join('')}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Função para Duplicar a Semana Atual para a Próxima
  const handleDuplicarSemana = async () => {
    if (!window.confirm("Deseja copiar todos os agendamentos desta semana para a PRÓXIMA semana?")) return;

    setLoading(true);
    try {
      const agendamentosAtuais = Object.values(agendamentos).flat();
      // Filtra apenas agendamentos ativos (ignora cancelados)
      const validos = agendamentosAtuais.filter(a => a.status !== 'Cancelado');

      if (validos.length === 0) {
        alert("Não há agendamentos ativos nesta semana para copiar.");
        setLoading(false);
        return;
      }

      const promises = validos.map(item => {
        const dataOriginal = new Date(item.data_hora);
        const novaData = new Date(dataOriginal);
        novaData.setDate(novaData.getDate() + 7); // Soma 7 dias

        return api.post('/agendamentos', {
          paciente_id: item.paciente_id,
          data_hora: novaData.toISOString(),
          status: 'Pendente', // Reseta status para Pendente
          servico_tipo: item.servico_tipo,
          duracao_minutos: 60,
          observacoes: item.observacoes
        });
      });

      await Promise.all(promises);
      alert("Agenda duplicada com sucesso para a próxima semana!");
      proximaSemana(); // Navega para a próxima semana para conferir
    } catch (error) {
      console.error("Erro ao duplicar agenda:", error);
      alert("Ocorreu um erro ao duplicar alguns agendamentos. Verifique se já existem agendamentos no destino.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agendamento-container">
      <div className="header-agenda">
        <div className="titulo-secao">
          <h2>Agenda Semanal</h2>
          <span className="intervalo-datas">{getIntervaloExibicao()}</span>
        </div>
        <div className="controles-navegacao">
          <button onClick={semanaAnterior} className="btn-nav" aria-label="Semana anterior">&lt; Anterior</button>
          <button onClick={irParaHoje} className="btn-nav">Hoje</button>
          <button onClick={proximaSemana} className="btn-nav" aria-label="Próxima semana">Próxima &gt;</button>
          
          {/* Seletor de Data (Calendário) */}
          <input 
            type="date" 
            className="input-data-nav"
            value={getDataISO()}
            onChange={handleDataChange}
            title="Ir para uma data específica"
          />

          {/* Botão de Imprimir */}
          <button onClick={handlePrint} className="btn-nav" title="Imprimir Agenda Semanal">
            🖨️ Imprimir
          </button>

          {/* Botão de Duplicar Semana */}
          <button onClick={handleDuplicarSemana} className="btn-duplicar" title="Copiar agendamentos para a próxima semana">
            📑 Replicar Semana
          </button>

          {loading && <span className="loading-badge">↻</span>}
        </div>
      </div>
      
      {/* Navegação de Dias (Apenas Mobile) */}
      <div className="mobile-day-controls">
        <button 
          className="btn-mobile-nav" 
          onClick={() => setMobileDayIndex(prev => Math.max(0, prev - 1))}
          disabled={mobileDayIndex === 0}
          aria-label="Dia anterior"
        >
          &lt;
        </button>
        <select 
          className="mobile-day-select"
          value={mobileDayIndex}
          onChange={(e) => setMobileDayIndex(parseInt(e.target.value, 10))}
        >
          {dias.map((dia, index) => (
            <option key={dia.key} value={index}>{dia.label} - {formatarDataCabecalho(dia.key)}</option>
          ))}
        </select>
        <button 
          className="btn-mobile-nav" 
          onClick={() => setMobileDayIndex(prev => Math.min(dias.length - 1, prev + 1))}
          disabled={mobileDayIndex === dias.length - 1}
          aria-label="Próximo dia"
        >
          &gt;
        </button>
      </div>

      {/* Visualização Mobile em Lista (Substitui a tabela em telas pequenas) */}
      <div className="mobile-agenda-view">
        {horarios.map(horario => {
          const dia = dias[mobileDayIndex];
          // Proteção caso o índice do dia esteja fora de sincronia
          if (!dia) return null;

          const key = `${dia.key}-${horario}`;
          const lista = getAgendamentosSlot(key);
          const ocupados = lista.length;
          const vagas = 3 - ocupados;

          return (
            <div 
              key={key} 
              className={`mobile-card-slot ${ocupados >= 3 ? 'lotado' : ''}`}
              onClick={() => abrirModal(dia.key, horario)}
            >
              <div className="mobile-card-time">{horario}</div>
              <div className="mobile-card-content">
                <div className="mobile-card-names">
                  {lista.length > 0 ? (
                    lista.map(p => (
                      <div key={p.id} className="mobile-patient-row">
                        <span className={`service-indicator ${p.servico_tipo ? p.servico_tipo.toLowerCase() : 'outro'}`} title={p.servico_tipo}></span>
                        <span>{p.nome_paciente}</span>
                      </div>
                    ))
                  ) : <span className="text-muted">Disponível</span>}
                </div>
                <div className="mobile-card-vagas">
                  {vagas > 0 ? `${vagas} vaga(s) restante(s)` : 'Lotado'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabela-responsiva">
        <table className="tabela-agendamento">
          <thead>
            <tr>
              <th className="coluna-horario-header">Horário</th>
              {dias.map((dia, index) => (
                <th 
                  key={dia.key} 
                  className={`coluna-dia ${index === mobileDayIndex ? 'mobile-active' : ''}`}
                >
                  {dia.label}
                  <div className="data-cabecalho">
                    {formatarDataCabecalho(dia.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map(horario => (
              <tr key={horario}>
                <td className="coluna-horario">{horario}</td>
                {dias.map((dia, index) => {
                  const key = `${dia.key}-${horario}`;
                  const lista = getAgendamentosSlot(key);
                  const ocupados = lista.length;
                  const statusClass = ocupados === 0 ? 'livre' : (ocupados >= 3 ? 'lotado' : 'parcial');
                  
                  return (
                    <td 
                      key={key} 
                      className={`celula-agendamento ${statusClass} ${index === mobileDayIndex ? 'mobile-active' : ''}`}
                      onClick={() => abrirModal(dia.key, horario)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dia.key, horario)}
                      role="button"
                      aria-label={`Horário ${horario} ${dia.label}, ${3 - ocupados} vagas disponíveis`}
                      tabIndex="0"
                    >
                      {ocupados > 0 ? (
                        <div className="lista-pacientes-celula">
                          {lista.map(p => (
                            <div 
                              key={p.id} 
                              className={`paciente-tag status-${p.status}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, p.id)}
                              title={`${p.nome_paciente} (${p.servico_tipo}) - ${p.status}${p.status === 'Cancelado' && p.observacoes ? `\nMotivo: ${p.observacoes}` : ''}`}
                            >
                              {(p.status === 'concluido' || p.status === 'Realizado') && '✓ '}
                              {p.nome_paciente} <small>({p.servico_tipo})</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="livre-label">Disponível</span>
                      )}
                      <div className="vagas-restantes">{3 - ocupados} vagas</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Agendamento */}
      {modalAberto && slotSelecionado && (() => {
        const listaAtual = getAgendamentosSlot(slotSelecionado.key);
        const vagasDisponiveis = 3 - listaAtual.length;

        return (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>
              Gerenciar Horário ({vagasDisponiveis} vagas)
            </h3>
            <p className="modal-info">
              {dias.find(d => d.key === slotSelecionado.diaKey)?.label} às {slotSelecionado.horario}
            </p>
            
            {/* Lista de Pacientes Já Agendados */}
            <div className="lista-modal">
              {listaAtual.length === 0 && <p className="text-muted">Nenhum paciente neste horário.</p>}
              {listaAtual.map(p => (
                <div key={p.id} className="item-paciente-modal">
                  <div className="info-p">
                    <span className={`badge-status ${p.status}`}>{p.status}</span>
                    <strong 
                      onClick={() => handleAbrirAtendimento(p)}
                      style={{ cursor: 'pointer', color: '#1565c0', textDecoration: 'underline' }}
                      title="Clique para iniciar Avaliação ou Evolução"
                    >
                      {p.nome_paciente}
                    </strong> <span style={{fontSize:'0.8em', color:'#666'}}>({p.servico_tipo})</span>
                  </div>
                  
                  <div className="actions-p">
                    {/* Botão de Evolução / Prontuário */}
                    <button 
                      className="btn-icon" 
                      title="Prontuário / Evolução"
                      onClick={() => {
                        if (p.paciente_id) {
                          navigate(`/pacientes/${p.paciente_id}`);
                        } else {
                          alert("Erro: ID do paciente não identificado neste agendamento.");
                        }
                      }}
                    >
                      📋
                    </button>
                    {/* Botão de Concluir (Check) */}
                    {p.status !== 'Realizado' && (
                      <button 
                        className="btn-icon btn-check" 
                        title="Marcar como Realizado"
                        onClick={() => handleStatusChange(p.id, 'Realizado')}
                      >
                        ✓
                      </button>
                    )}
                    {/* Botão de Cancelar (Novo) */}
                    {p.status !== 'Cancelado' && p.status !== 'Realizado' && (
                      <button 
                        className="btn-icon btn-cancel" 
                        title="Cancelar Agendamento (Mantém no histórico)"
                        onClick={() => {
                          const motivo = window.prompt(`Deseja cancelar o agendamento de ${p.nome_paciente}?\n\nSe sim, informe o motivo (opcional):`);
                          // Se o usuário clicar em "OK" (mesmo com o campo vazio), o prompt retorna uma string.
                          // Se clicar em "Cancelar", retorna null.
                          if (motivo !== null) {
                            handleStatusChange(p.id, 'Cancelado', motivo);
                          }
                        }}
                      >
                        🚫
                      </button>
                    )}
                    <button type="button" className="btn-remove-sm" onClick={() => handleRemover(p.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário para Adicionar (se houver vaga) */}
            {vagasDisponiveis > 0 && (
              <div className="novo-agendamento-box">
                <div className="tabs-criacao">
                  <button 
                    className={modoCriacao === 'existente' ? 'active' : ''} 
                    onClick={() => setModoCriacao('existente')}
                  >
                    Já é Paciente
                  </button>
                  <button 
                    className={modoCriacao === 'novo' ? 'active' : ''} 
                    onClick={() => setModoCriacao('novo')}
                  >
                    Novo Cadastro
                  </button>
                </div>

                <form onSubmit={handleAdicionarAgendamento} className="form-adicionar">
                  {modoCriacao === 'existente' ? (
                    <div className="form-group" style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        value={nomePaciente}
                        onChange={(e) => handleBuscaPaciente(e.target.value)}
                        placeholder="Buscar nome do paciente..."
                        autoFocus
                        className="formInput"
                        autoComplete="off"
                      />
                      {/* Lista de Sugestões */}
                      {sugestoes.length > 0 && (
                        <ul className="sugestoes-lista">
                          {sugestoes.map(s => (
                            <li key={s.id} onClick={() => selecionarPaciente(s)}>{s.nome}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="form-novo-paciente">
                      <input 
                        type="text" placeholder="Nome Completo" required className="formInput mb-2"
                        value={novoPacienteDados.nome}
                        onChange={e => setNovoPacienteDados({...novoPacienteDados, nome: e.target.value})}
                      />
                      <input 
                        type="date" required className="formInput mb-2"
                        value={novoPacienteDados.data_nascimento}
                        onChange={e => setNovoPacienteDados({...novoPacienteDados, data_nascimento: e.target.value})}
                      />
                      <input 
                        type="text" placeholder="Telefone / WhatsApp" className="formInput mb-2"
                        value={novoPacienteDados.telefone}
                        onChange={e => setNovoPacienteDados({...novoPacienteDados, telefone: e.target.value})}
                      />
                    </div>
                  )}

                  {/* Campo de Tipo de Sessão (Obrigatório) */}
                  <select 
                    className="formInput mb-2" 
                    value={tipoSessao} 
                    onChange={(e) => setTipoSessao(e.target.value)}
                  >
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Pilates">Pilates</option>
                    <option value="Outro">Outro</option>
                  </select>

                  <button type="submit" className="btn-salvar full-width">Agendar Paciente</button>
              </form>
              </div>
            )}

            {vagasDisponiveis === 0 && (
              <div className="alerta-lotado">⚠️ Horário Lotado</div>
            )}

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={fecharModal}>Fechar</button>
              </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Atendimento (Avaliação/Evolução) */}
      <AtendimentoModal 
        isOpen={atendimentoModalOpen}
        onClose={() => setAtendimentoModalOpen(false)}
        onSave={handleSaveAtendimento}
        pacienteNome={agendamentoEmAtendimento?.nome_paciente}
      />
    </div>
  );
}