import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import PacienteFormModal from '../components/PacienteFormModal';
import styles from './PacientesPage.module.css';

// Classes globais/comuns (Assumindo que estão no seu App.css)
const commonClasses = {
    error: 'errorMsg',
    loading: 'loadingText',
};


const PacientesPage = () => {
    // ESTADOS
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar o MODAL
    const [searchTerm, setSearchTerm] = useState('');
    const [pacienteToEdit, setPacienteToEdit] = useState(null);

    const navigate = useNavigate();
    const { signOut } = useAuth();

    // FUNÇÕES DE LÓGICA
    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        if (isNaN(data.getTime())) {
            return 'Data Inválida';
        }
        return data.toLocaleDateString('pt-BR');
    };

    const fetchPacientes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/pacientes');
            const lista = response.data.pacientes || [];
            // Ordena a lista alfabeticamente pelo nome
            lista.sort((a, b) => a.nome.localeCompare(b.nome));
            setPacientes(lista);
            setError(null);
        } catch (err) {
            console.error("Erro ao buscar pacientes:", err.response || err);
            if (err.response?.status === 403) {
                signOut();
                return;
            }
            setError('Não foi possível carregar os pacientes. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPaciente = () => {
        setPacienteToEdit(null); // Modo de Adição
        setIsModalOpen(true);
    };

    const handleEditPaciente = (paciente) => {
        // 💡 CORREÇÃO: Formata a data para YYYY-MM-DD para que o input type="date" do modal a reconheça corretamente.
        // Isso evita que o campo venha vazio e cause erro ao salvar.
        const pacienteFormatado = { ...paciente };
        
        if (pacienteFormatado.data_nascimento) {
            pacienteFormatado.data_nascimento = pacienteFormatado.data_nascimento.split('T')[0];
        } else if (pacienteFormatado.nascimento) {
            // Fallback caso o backend retorne como 'nascimento'
            pacienteFormatado.data_nascimento = pacienteFormatado.nascimento.split('T')[0];
        }

        setPacienteToEdit(pacienteFormatado); 
        setIsModalOpen(true);
    };

    const handleInativarPaciente = async (pacienteId, pacienteNome) => {
        if (!window.confirm(`Tem certeza que deseja INATIVAR o paciente ${pacienteNome}? Seus registros antigos serão mantidos, mas ele não aparecerá nas listas ativas.`)) {
            return;
        }

        try {
            await api.patch(`/pacientes/${pacienteId}/inativar`);
            alert(`Paciente ${pacienteNome} inativado com sucesso.`);
            fetchPacientes();
        } catch (err) {
            console.error("Erro ao inativar paciente:", err.response || err);
            alert('Erro ao inativar paciente. Verifique o console.');
        }
    };

    const handlePatientFormClosed = () => {
        setIsModalOpen(false);
        setPacienteToEdit(null);
        fetchPacientes(); // Atualiza a lista após fechar o modal (adicionar/editar)
    };

    const handleViewPaciente = (pacienteId) => {
        navigate(`/pacientes/${pacienteId}`);
    };

    useEffect(() => {
        fetchPacientes();
    }, []);

    if (loading) {
        return <h2 className={commonClasses.loading}>Carregando lista de pacientes...</h2>;
    }

    if (error) {
        return <h2 className={commonClasses.error}>{error}</h2>;
    }

    // Filtra os pacientes
    const filteredPacientes = pacientes.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Gestão de Pacientes</h1>
                <button onClick={handleAddPaciente} className={styles.addButton}>
                    + Adicionar Novo Paciente
                </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className={styles.searchBar}>
                <div className={styles.searchInputContainer}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar paciente por nome, telefone ou e-mail..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TABELA DE PACIENTES */}
            {filteredPacientes.length === 0 ? (
                <p>Nenhum paciente ativo encontrado com o termo de busca **"{searchTerm}"**.</p>
            ) : (
                <table className={styles.pacientesTable}>
                    <thead>
                        <tr>
                            <th className={styles.tableHeader}>ID</th>
                            <th className={styles.tableHeader}>Nome</th>
                            <th className={styles.tableHeader}>Telefone</th>
                            <th className={styles.tableHeader}>Data Cadastro</th>
                            <th className={styles.tableHeader}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPacientes.map((paciente) => (
                            <tr key={paciente.id}>
                                <td className={styles.tableData}>{paciente.id}</td>
                                <td className={styles.tableData}>{paciente.nome}</td>
                                <td className={styles.tableData}>{paciente.telefone}</td>
                                <td className={styles.tableData}>{formatarData(paciente.criado_em)}</td>
                                <td className={styles.tableDataActions}>
                                    <div className="table-actions">
                                        <button className={styles.viewButton}>Prontuário</button>
                                        <button className={styles.editButton}>Editar</button>
                                        <button className={styles.inactivateButton}>Inativar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* CHAMADA CORRETA DO MODAL - ÚNICA INSTÂNCIA DO FORMULÁRIO */}
            <PacienteFormModal
                isOpen={isModalOpen}
                onClose={() => handlePatientFormClosed()}
                paciente={pacienteToEdit}
                onSave={handlePatientFormClosed}
            />
        </div>
    );
};
export default PacientesPage;