import React, { useState, useEffect } from 'react'; 
import api from '../api/api';
import styles from './PacoteBaseFormModal.module.css';

const commonClasses = {
    overlay: 'modalOverlay',
    content: 'modalContent',
    header: 'modalHeader',
    close: 'closeBtn',
    form: 'form',
    label: 'formLabel',
    input: 'formInput',
    error: 'errorMsg',
    select: 'formInput'
};

const PacoteBaseFormModal = ({ isOpen, onClose, onSave, pacote }) => {
    
    // ESTADOS
    const [nome, setNome] = useState('');
    const [sessaoTotal, setSessaoTotal] = useState('');
    const [valor, setValor] = useState('');
    const [duracaoDias, setDuracaoDias] = useState('');
    const [tipoSessao, setTipoSessao] = useState('Fisioterapia');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);

    const isEditing = !!pacote; 

    // FUNÇÃO PARA LIMPAR O FORMULÁRIO
    const resetForm = () => {
        setNome('');
        setSessaoTotal('');
        setValor('');
        setDuracaoDias('0');
        setTipoSessao('Fisioterapia');
        setErro(null);
    };

    // EFEITO PARA CARREGAR DADOS (EDITAR)
    useEffect(() => {
        if (pacote) {
            setNome(pacote.nome || '');
            // ATENÇÃO: Se o backend retornar 'total_sessoes', use ele.
            setSessaoTotal(pacote.total_sessoes || pacote.sessao_total || ''); 
            // Assumindo que o valor é armazenado em centavos e precisa ser formatado para R$
            setValor(pacote.valor_centavos ? (pacote.valor_centavos / 100).toFixed(2).replace('.', ',') : ''); 
            setDuracaoDias(pacote.duracao_dias || '0');
            setTipoSessao(pacote.tipo_sessao || 'Fisioterapia');
        } else {
            resetForm();
        }
    }, [pacote]);


    // MANIPULAÇÃO DO VALOR (Para garantir formato monetário)
    const handleValorChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
        
        // Limita a 10 dígitos (ajustável)
        if (value.length > 10) {
            value = value.substring(0, 10);
        }

        if (value.length > 2) {
            // Insere a vírgula antes dos dois últimos dígitos
            value = value.replace(/(\d{2})$/, ',$1');
        }
        
        setValor(value);
    };


    // SUBMISSÃO DO FORMULÁRIO
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro(null);
        setLoading(true);

        // Prepara os dados
        const valorEmCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100);
        
        const data = {
            nome,
            sessoes: parseInt(sessaoTotal), // 🎯 CORREÇÃO: Chave mudada de 'sessao_total' para 'sessoes' para corresponder ao backend
            valor: valorEmCentavos,
            duracao_dias: parseInt(duracaoDias),
            tipo_sessao: tipoSessao // Enviado, mas o backend atual pode ignorá-lo se não estiver no INSERT/UPDATE
        };

        try {
            if (isEditing) {
                // 🚀 CORREÇÃO DE ROTA (PUT /api/pacotes/base/:id)
                await api.put(`/pacotes/base/${pacote.id}`, data);
            } else {
                // 🚀 CORREÇÃO DE ROTA (POST /api/pacotes/base)
                await api.post('/pacotes/base', data);
            }
            onSave();
            onClose(); // Fecha o modal
        } catch (err) {
            console.error("Erro ao salvar pacote:", err.response || err);
            setErro(err.response?.data?.message || 'Erro ao salvar. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen) {
        return null;
    }

    return (
        <div className={commonClasses.overlay}>
            <div className={commonClasses.content}>
                <div className={commonClasses.header}>
                    <h2>{isEditing ? `Editar Pacote: ${pacote.nome}` : 'Criar Novo Pacote Base'}</h2>
                    <button onClick={() => { onClose(); resetForm(); }} className={commonClasses.close}>
                        &times;
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className={commonClasses.form}>
                    {/* Nome do Pacote */}
                    <label className={commonClasses.label}>Nome do Pacote:</label>
                    <input 
                        type="text" 
                        value={nome} 
                        onChange={(e) => setNome(e.target.value)} 
                        className={commonClasses.input}
                        required 
                    />

                    {/* Número de Sessões */}
                    <label className={commonClasses.label}>Número de Sessões:</label>
                    <input 
                        type="number" 
                        value={sessaoTotal} 
                        onChange={(e) => setSessaoTotal(e.target.value)} 
                        className={commonClasses.input} 
                        min="1" 
                        required 
                    />

                    {/* Valor Total */}
                    <label className={commonClasses.label}>Valor Total (R$):</label>
                    <input 
                        type="text" 
                        value={valor} 
                        onChange={handleValorChange} 
                        className={commonClasses.input} 
                        required 
                        placeholder="Ex: 900,00"
                        inputMode="numeric"
                    />
                    
                    {/* Prazo de Validade */}
                    <label className={commonClasses.label}>Prazo de Validade (dias):</label>
                    <input 
                        type="number" 
                        value={duracaoDias} 
                        onChange={(e) => setDuracaoDias(e.target.value)} 
                        className={commonClasses.input} 
                        min="0" 
                        required 
                    />
                    <small className={styles.smallText}>Use 0 para Sem Limite de validade.</small>

                    {/* Tipo de Serviço (Opcional) */}
                    <label className={commonClasses.label}>Tipo de Serviço (Exibição local):</label>
                    <select 
                        value={tipoSessao} 
                        onChange={(e) => setTipoSessao(e.target.value)} 
                        className={commonClasses.select}
                        required
                    >
                        <option value="Fisioterapia">Fisioterapia</option>
                        <option value="Pilates">Pilates</option>
                        <option value="TerapiaManual">Terapia Manual</option>
                        <option value="Outro">Outro</option>
                    </select>

                    {erro && <p className={commonClasses.error}>{erro}</p>}

                    <button type="submit" className={styles.submitButtonPacote} disabled={loading}>
                        {loading 
                            ? `${isEditing ? 'Salvando...' : 'Cadastrando...'}` 
                            : `${isEditing ? 'Salvar Edição' : 'Cadastrar Pacote'}`
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PacoteBaseFormModal;