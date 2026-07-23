import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Layout.module.css";

// 💡 1. Importando os ícones profissionais do Lucide
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  Package,
  BarChart2,
  LogOut
} from "lucide-react";

const Layout = () => {
  const { usuario, signOut } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState("");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 💡 2. Substituindo os emojis pelos componentes de ícones correspondentes
  const navLinks = [
    { path: "/", label: "Início", icon: LayoutDashboard },
    { path: "/pacientes", label: "Pacientes", icon: Users },
    {
      label: "Agenda",
      icon: Calendar,
      id: "agenda",
      sublinks: [
        { path: "/agenda/semanal", label: "Agenda Semanal" },
        { path: "/agenda/sessoes", label: "Agenda de Sessões" },
      ],
    },
    { path: "/pilates", label: "Pilates", icon: Activity },
    { path: "/pacotes", label: "Pacotes/Créditos", icon: Package },
    { path: "/relatorios", label: "Relatórios", icon: BarChart2 },
  ];

  useEffect(() => {
    const activeSubmenu = navLinks.find(
      (link) =>
        link.sublinks &&
        link.sublinks.some((sl) => location.pathname.startsWith(sl.path)),
    );
    if (activeSubmenu) {
      setOpenSubmenu(activeSubmenu.id);
    }
  }, [location.pathname]);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const toggleSubmenu = (id) => setOpenSubmenu(openSubmenu === id ? "" : id);
  const closeMobileMenu = () => {
    if (isMobileMenuOpen) setMobileMenuOpen(false);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      toggleMobileMenu();
    } else {
      setSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const getNavLinkClass = (path) => {
    const isActive =
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path);

    return `${styles.navLink} ${isActive ? styles.active : ""}`;
  };

  const isSubmenuActive = (sublinks) => {
    return sublinks.some((sublink) =>
      location.pathname.startsWith(sublink.path),
    );
  };

  const getSubmenuNavClass = (link) => {
    const isActive = isSubmenuActive(link.sublinks);
    return `${styles.navLink} ${isActive ? styles.active : ""}`;
  };

  return (
    <div className={styles.appContainer}>
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ""}`}
        aria-hidden={!isMobileMenuOpen}
        style={{
          display: isSidebarCollapsed && !isMobileMenuOpen ? "none" : undefined,
        }}
      >
        <button
          className={styles.closeButton}
          onClick={closeMobileMenu}
          aria-label="Fechar menu"
        >
          &times;
        </button>
        <h1 className={styles.logo}>
          FISIO<span className={styles.logoHighlight}>APP</span>
        </h1>

        <nav className={styles.nav}>
          {navLinks.map((link) => {
            // 💡 Renderiza o componente do ícone dinamicamente
            const IconComponent = link.icon;

            return link.sublinks ? (
              <div key={link.id}>
                <div
                  className={getSubmenuNavClass(link)}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSubmenu(link.id)}
                >
                  <span className={styles.navIcon}>
                    <IconComponent size={20} strokeWidth={2} />
                  </span>
                  {link.label}
                  <span
                    style={{
                      float: "right",
                      transition: "transform 0.2s",
                      transform:
                        openSubmenu === link.id
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>
                {openSubmenu === link.id && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      borderRadius: "0 0 8px 8px",
                    }}
                  >
                    {link.sublinks.map((sublink) => (
                      <Link
                        key={sublink.path}
                        to={sublink.path}
                        className={getNavLinkClass(sublink.path)}
                        style={{ paddingLeft: "50px", fontSize: "0.9em" }}
                        onClick={closeMobileMenu}
                      >
                        {sublink.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={getNavLinkClass(link.path)}
                onClick={closeMobileMenu}
              >
                <span className={styles.navIcon}>
                  <IconComponent size={20} strokeWidth={2} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.userInfoSidebar}>
            Logado como: <br />{" "}
            <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
              {usuario?.nome || "Guilherme Sardinha"}
            </span>
          </p>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main
        className={styles.mainContent}
        style={{
          marginLeft: isSidebarCollapsed ? 0 : undefined,
          width: isSidebarCollapsed ? "100%" : undefined,
        }}
      >
        <header className={styles.header}>
          <button
            onClick={handleToggleSidebar}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              marginRight: "15px",
              color: "#333",
            }}
            title={isSidebarCollapsed ? "Abrir Menu" : "Fechar Menu"}
          >
            ☰
          </button>

          <div className={styles.userInfo}>Painel de Controle</div>
          <button onClick={signOut} className={styles.logoutButton}>
            {/* 💡 2. Substituiu o emoji 🚪 pelo componente do Lucide */}
            <span
              className={styles.navIcon}
              style={{ marginRight: "6px", width: "auto" }}
            >
              <LogOut size={18} strokeWidth={2} />
            </span>
            Sair
          </button>
        </header>

        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
