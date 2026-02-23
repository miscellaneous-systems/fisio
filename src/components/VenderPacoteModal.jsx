import React, { useState, useEffect } from 'react';
import api from '../api/api';
import styles from './VenderPacoteModal.module.css'; // Importa estilos modulares

// 💡 CONSTANTE MOVIDA PARA FORA: Evita que seja recriada a cada renderização.
const initialFormData = {
    pacienteId: '',
    modeloId: '',
    valorPago: '',
    dataValidade: '',
    observacoes: '',
};
// Função auxiliar para formatar a data (YYYY-MM-DD)
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

const VenderPacoteModal = ({ isOpen, onClose, onVenda, modelosPacotes }) => {
    
    // 1. ESTADOS
    const [pacientes, setPacientes] = useState([]);
    const [loadingPacientes, setLoadingPacientes] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
  
    const fetchPacientes = async () => {
        setLoadingPacientes(true);
        try {
            const response = await api.get('/pacientes');
            setPacientes(response.data.pacientes || []);
        } catch (err) {
            console.error("Erro ao buscar pacientes:", err);
        } finally {
            setLoadingPacientes(false);
        }
    };

  // 3. EFEITO PARA CARREGAR PACIENTES (somente quando o modal abre)
  useEffect(() => {
      if (isOpen) {
          fetchPacientes();
          // Reseta o formulário ao abrir
          setFormData(initialFormData);
          setError(null);
          }
  // 💡 CORREÇÃO: Removido initialFormData da dependência para evitar re-execução desnecessária.
  // Adicionado modelosPacotes para evitar warning, embora não seja estritamente necessário para fetch.
  }, [isOpen, modelosPacotes]);

  // 4. LÓGICA DE MANIPULAÇÃO DO FORMULÁRIO
  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 💡 EFEITO SEPARADO: Para preenchimento automático quando o modelo de pacote muda.
  useEffect(() => {
      if (formData.modeloId) {
          const modelo = modelosPacotes.find(m => m.id === parseInt(formData.modeloId, 10));
          if (!modelo) return;

          // Preenche o valor pago com o valor base do modelo
          // Usa toLocaleString APENAS para exibição. O estado deve guardar string simples para facilitar a edição pelo usuário.
          const valorFormatado = (modelo.valor_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          // Calcula a data de validade automática
          let dataValidade = '';
          if (modelo.duracao_dias > 0) {
              const dataHoje = new Date();
              dataHoje.setDate(dataHoje.getDate() + modelo.duracao_dias);
              dataValidade = formatDate(dataHoje);
          }

          setFormData(prev => ({
              ...prev,
              valorPago: valorFormatado,
              dataValidade: dataValidade,
          }));
      }
  }, [formData.modeloId, modelosPacotes]);
  
  // 5. LÓGICA DE SUBMISSÃO
  const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      // Validação básica
      if (!formData.pacienteId || !formData.modeloId) {
          setError('Selecione o paciente e o modelo de pacote.');
          setSubmitting(false);
          return;
      }

      try {
          // 💡 CORREÇÃO: Conversão de valor mais robusta para centavos (ex: "1.234,56" -> 123456)
          // Remove pontos de milhar e substitui vírgula por ponto para parsear como float.
          const cleanedValor = String(formData.valorPago).replace(/\./g, '').replace(',', '.');
          const valorEmCentavos = Math.round(parseFloat(cleanedValor) * 100);

          if (isNaN(valorEmCentavos)) {
              setError('O valor pago é inválido. Use o formato 1.234,56.');
              setSubmitting(false);
              return;
          }

            // 🎯 CORREÇÃO: Define a variável 'modeloParaEnvio' que estava faltando.
            const modeloParaEnvio = modelosPacotes.find(m => m.id === parseInt(formData.modeloId, 10));
            if (!modeloParaEnvio) {
                setError('O modelo de pacote selecionado é inválido. Tente novamente.');
                setSubmitting(false);
                return;
            }

            // 🎯 CORREÇÃO: Monta o payload com os campos corretos que o backend espera.
              const payload = {
                   paciente_id: parseInt(formData.pacienteId, 10),
                nome_pacote: modeloParaEnvio.nome,
                total_sessoes: modeloParaEnvio.total_sessoes,
                valor_total: valorEmCentavos, // O backend espera 'valor_total'
                data_vencimento: formData.dataValidade || null,
              };

            // A rota POST '/pacotes' já está correta.
              const response = await api.post('/pacotes', payload);

              alert('Pacote vendido com sucesso!');
              onVenda(response.data.pacote); // Chama o callback de sucesso
              onClose(); // Fecha o modal

          } catch (err) {
              console.error("Erro ao vender pacote:", err.response || err);
              setError(err.response?.data?.message || 'Erro ao vender pacote. Verifique os dados e a conexão.');
          } finally {
              setSubmitting(false);
          }
      };
      
      // Fim da Lógica
      // ------------------------------------

      if (!isOpen) return null;

      const modeloSelecionado = modelosPacotes.find(m => m.id === parseInt(formData.modeloId, 10));
      

return (
    <div className={`${styles.modalOverlay} container`} onClick={onClose}>
        <div 
            className={`${styles.modalContent} modalContent`} 
            onClick={(e) => e.stopPropagation()}
        > 
            <h2>Vender Pacote ao Paciente</h2>
            <form onSubmit={handleSubmit}>
                 
                 {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
                 
                 {/* SELEÇÃO DO PACIENTE */}
                 <div className={styles.formGroup}>
                     <label className={styles.formLabel} htmlFor="pacienteId">👤 Paciente:</label>
                     <select
                         id="pacienteId"
                         name="pacienteId"
                         value={formData.pacienteId}
                         onChange={handleChange}
                         required
                         className={styles.formInput} 
                         disabled={loadingPacientes || submitting}
                     >
                         <option value="">{loadingPacientes ? 'Carregando...' : 'Selecione o Paciente'}</option>
                         {pacientes.map(p => (
                             <option key={p.id} value={p.id}>{p.nome}</option>
                         ))}
                     </select>
                 </div>

                 {/* SELEÇÃO DO MODELO BASE */}
                 <div className={styles.formGroup}>
                     <label className={styles.formLabel} htmlFor="modeloId">📦 Modelo de Pacote:</label>
                     <select
                         id="modeloId"
                         name="modeloId"
                         value={formData.modeloId}
                         onChange={handleChange}
                         required
                         className={styles.formInput}
                         disabled={submitting}
                     >
                         <option value="">Selecione o Modelo Base</option>
                         {modelosPacotes.map(m => (
                             <option key={m.id} value={m.id}>
                                 {m.nome} ({m.total_sessoes} Sessões | R$ {parseFloat(m.valor_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                             </option>
                         ))}
                     </select>
                     {modeloSelecionado && (
                         <small className={styles.feedbackText}>
                             Saldo inicial: <strong>{modeloSelecionado.total_sessoes} sessões</strong>. Prazo: {modeloSelecionado.duracao_dias === 0 ? 'Sem limite' : `${modeloSelecionado.duracao_dias} dias`}.
                         </small>)}
                 </div>
                 
                 {/* VALOR PAGO */}
                 <div className={styles.formGroup}>
                     <label className={styles.formLabel} htmlFor="valorPago">💰 Valor Pago (R$):</label>
                     <input 
                         id="valorPago"
                         type="text" 
                         name="valorPago" 
                         value={formData.valorPago} 
                         onChange={handleChange} 
                         required 
                         className={styles.formInput}
                         placeholder="Ex: 900,00"
                         inputMode="numeric"
                         disabled={submitting}
                     />
                     {/* 💡 Usa classe do módulo */}
                     <small className={styles.noticeText}>Opcional: Altere o valor se o paciente pagou um preço diferente do preço base.</small>
                 </div>

                 {/* DATA DE VALIDADE */}
                 <div className={styles.formGroup}>
                     <label className={styles.formLabel} htmlFor="dataValidade">🗓️ Data de Validade:</label>
                     <input 
                         id="dataValidade"
                         type="date" 
                         name="dataValidade" 
                         value={formData.dataValidade} 
                         onChange={handleChange} 
                         className={styles.formInput}
                         disabled={submitting}
                     />
                     <small className={styles.noticeText}>Se o modelo tiver prazo, a data é preenchida automaticamente. Limpe para deixar sem validade.</small>
                 </div>
                 
                 {/* OBSERVAÇÕES */}
                 <div className={styles.formGroup}>
                     <label className={styles.formLabel} htmlFor="observacoes">Observações:</label>
                     <textarea
                         id="observacoes"
                         name="observacoes"
                         value={formData.observacoes}
                         onChange={handleChange}
                         className={`${styles.formInput} ${styles.textarea}`}
                         disabled={submitting}
                     />
                 </div>

                 {/* BOTÕES DE AÇÃO */}
                 <div className={styles.actions}>
                     <button type="button" onClick={onClose} className={styles.cancelButton} disabled={submitting}>
                         Cancelar
                     </button>
                     <button type="submit" className={styles.saveButton} disabled={submitting || loadingPacientes}>
                         {submitting ? 'Registrando Venda...' : 'Vender Pacote'}
                     </button>
                 </div>
            </form>
        </div>
    </div>
);
};
export default VenderPacoteModal;