import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import PacienteFormModal from "../components/PacienteFormModal";
import styles from "./PacientesPage.module.css";
import { 
  Search, 
  UserPlus, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Edit, 
  UserX 
} from "lucide-react";

// Classes globais/comuns
const commonClasses = {
  error: "errorMsg",
  loading: "loadingText",
};

const PacientesPage = () => {
  // ESTADOS
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pacienteToEdit, setPacienteToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({
    key: "nome",
    direction: "asc",
  });

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const formatarData = (dataString) => {
    if (!dataString) return "N/A";
    const data = new Date(dataString);
    if (isNaN(data.getTime())) {
      return "Data Inválida";
    }
    return data.toLocaleDateString("pt-BR");
  };

  const fetchPacientes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/pacientes");
      const lista = response.data.pacientes || [];
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
      setPacientes(lista);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err.response || err);
      if (err.response?.status === 403) {
        signOut();
        return;
      }
      setError(
        "Não foi possível carregar os pacientes. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaciente = () => {
    setPacienteToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditPaciente = (paciente) => {
    const pacienteFormatado = { ...paciente };
    if (pacienteFormatado.data_nascimento) {
      pacienteFormatado.data_nascimento =
        pacienteFormatado.data_nascimento.split("T")[0];
    } else if (pacienteFormatado.nascimento) {
      pacienteFormatado.data_nascimento =
        pacienteFormatado.nascimento.split("T")[0];
    }
    setPacienteToEdit(pacienteFormatado);
    setIsModalOpen(true);
  };

  const handleInativarPaciente = async (pacienteId, pacienteNome) => {
    if (
      !window.confirm(
        `Tem certeza que deseja INATIVAR o paciente ${pacienteNome}? Seus registros antigos serão mantidos, mas ele não aparecerá nas listas ativas.`,
      )
    ) {
      return;
    }

    try {
      await api.patch(`/pacientes/${pacienteId}/inativar`);
      alert(`Paciente ${pacienteNome} inativado com sucesso.`);
      fetchPacientes();
    } catch (err) {
      console.error("Erro ao inativar paciente:", err.response || err);
      alert("Erro ao inativar paciente. Verifique o console.");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handlePatientFormClosed = () => {
    setIsModalOpen(false);
    setPacienteToEdit(null);
    fetchPacientes();
  };

  const handleViewPaciente = (pacienteId) => {
    navigate(`/pacientes/${pacienteId}`);
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className={styles.centeredMessage} role="status">
        Carregando lista de pacientes...
      </div>
    );
  }

  if (error) {
    return <h2 className={commonClasses.error}>{error}</h2>;
  }

  const filteredPacientes = pacientes.filter((paciente) => {
    const term = searchTerm.toLowerCase();
    const nome = paciente.nome ? paciente.nome.toLowerCase() : "";
    const telefone = paciente.telefone ? paciente.telefone.toLowerCase() : "";
    const email = paciente.email ? paciente.email.toLowerCase() : "";
    return (
      nome.includes(term) || telefone.includes(term) || email.includes(term)
    );
  });

  const sortedPacientes = [...filteredPacientes].sort((a, b) => {
    let valueA = a[sortConfig.key];
    let valueB = b[sortConfig.key];

    if (valueA == null) valueA = "";
    if (valueB == null) valueB = "";

    if (typeof valueA === "string") valueA = valueA.toLowerCase();
    if (typeof valueB === "string") valueB = valueB.toLowerCase();

    if (valueA < valueB) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPacientes = sortedPacientes.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(sortedPacientes.length / itemsPerPage);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={16} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
    ) : (
      <ChevronDown size={16} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Gestão de Pacientes</h1>
        <button onClick={handleAddPaciente} className={styles.addButton}>
          <UserPlus size={18} /> Adicionar Novo Paciente
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputContainer}>
          <Search className={styles.searchIcon} size={18} />
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
        <p>
          Nenhum paciente ativo encontrado com o termo de busca **"{searchTerm}"**.
        </p>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.pacientesTable}>
            <thead>
              <tr>
                <th
                  className={styles.tableHeader}
                  onClick={() => handleSort("id")}
                  style={{ cursor: "pointer" }}
                >
                  ID {renderSortIcon("id")}
                </th>
                <th
                  className={styles.tableHeader}
                  onClick={() => handleSort("nome")}
                  style={{ cursor: "pointer" }}
                >
                  Nome {renderSortIcon("nome")}
                </th>
                <th
                  className={styles.tableHeader}
                  onClick={() => handleSort("telefone")}
                  style={{ cursor: "pointer" }}
                >
                  Telefone {renderSortIcon("telefone")}
                </th>
                <th
                  className={styles.tableHeader}
                  onClick={() => handleSort("criado_em")}
                  style={{ cursor: "pointer" }}
                >
                  Data Cadastro {renderSortIcon("criado_em")}
                </th>
                <th className={styles.tableHeader}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentPacientes.map((paciente) => (
                <tr key={paciente.id}>
                  <td className={styles.tableData} data-label="ID">
                    {paciente.id}
                  </td>
                  <td className={styles.tableData} data-label="Nome">
                    {paciente.nome}
                  </td>
                  <td className={styles.tableData} data-label="Telefone">
                    {paciente.telefone}
                  </td>
                  <td className={styles.tableData} data-label="Cadastro">
                    {formatarData(paciente.criado_em)}
                  </td>
                  <td className={styles.tableDataActions} data-label="Ações">
                    <div className="table-actions">
                      <button
                        onClick={() => handleViewPaciente(paciente.id)}
                        className={styles.viewButton}
                      >
                        <FileText size={15} /> Prontuário
                      </button>
                      <button
                        onClick={() => handleEditPaciente(paciente)}
                        className={styles.editButton}
                      >
                        <Edit size={15} /> Editar
                      </button>
                      <button
                        onClick={() =>
                          handleInativarPaciente(paciente.id, paciente.nome)
                        }
                        className={styles.inactivateButton}
                      >
                        <UserX size={15} /> Inativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTROLES DE PAGINAÇÃO */}
      {filteredPacientes.length > itemsPerPage && (
        <div className={styles.paginationContainer}>
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &larr; Anterior
          </button>

          <span className={styles.paginationInfo}>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>

          <button
            type="button"
            className={styles.paginationButton}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Próxima &rarr;
          </button>
        </div>
      )}

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