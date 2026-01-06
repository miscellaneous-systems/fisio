import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// 💡 1. Importa as classes CSS Modules
import styles from './Layout.module.css';

// 💡 2. Define as cores (Podemos manter aqui ou migrar como variáveis CSS globais)
const colors = {
    primaryGreen: '#007A4D', 
    secondaryGreen: '#00B050',
    white: '#ffffff',
    dangerRed: '#c0392b', 
};

const Layout = () => {
    const { usuario, signOut } = useAuth();
    const location = useLocation(); 
    
    // Rastreia o path do link que está em hover
    const [hoveredPath, setHoveredPath] = useState(null);

    // 💡 Novo estado para controlar o menu mobile
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState('');
    
    // 💡 Novo estado para controlar o menu no desktop (colapsar)
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Links de navegação (mantido)
    const navLinks = [
        { path: '/', label: 'Início', icon: '🏠' },
        { path: '/pacientes', label: 'Pacientes', icon: '👤' },
        { 
            label: 'Agenda', icon: '📅', id: 'agenda', sublinks: [
                { path: '/agenda/semanal', label: 'Agenda Semanal' },
                { path: '/agenda/sessoes', label: 'Agenda de Sessões' },
            ]
        },
        { path: '/pilates', label: 'Pilates', icon: '🧘‍♀️' }, 
        { path: '/pacotes', label: 'Pacotes/Créditos', icon: '📦' },
        { path: '/relatorios', label: 'Relatórios', icon: '📈' },
    ];

    useEffect(() => {
        const activeSubmenu = navLinks.find(link => 
            link.sublinks && link.sublinks.some(sl => location.pathname.startsWith(sl.path))
        );
        if (activeSubmenu) {
            setOpenSubmenu(activeSubmenu.id);
        }
    }, [location.pathname]);

    // 💡 Funções para controlar o menu mobile
    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
    const toggleSubmenu = (id) => setOpenSubmenu(openSubmenu === id ? '' : id);
    const closeMobileMenu = () => {
        if (isMobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    };
    
    // 💡 Função unificada para alternar o menu (Mobile ou Desktop)
    const handleToggleSidebar = () => {
        if (window.innerWidth <= 768) {
            toggleMobileMenu();
        } else {
            setSidebarCollapsed(!isSidebarCollapsed);
        }
    };

    // 💡 3. Função para obter a string de classes dinâmica (ATIVO e HOVER)
    const getNavLinkClasses = (path, index) => {
        // 💡 CORREÇÃO: Usa startsWith para manter o link ativo em sub-rotas (ex: /pacientes/1).
        // A rota '/' (Início) precisa de uma verificação exata para não ficar sempre ativa.
        const isActive = path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(path);
        const isHovered = hoveredPath === path;
        
        let classString = styles.navLink;

        // Estilos Ativos e de Hover (inline ou classes utilitárias que modificam o background)
        const activeStyle = {
            backgroundColor: colors.secondaryGreen,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        };
        const hoverStyle = {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
        };
        
        // Retorna o objeto de estilo que será passado no atributo 'style'
        // Isso é necessário porque o CSS Modules não pode lidar com :active, :hover e :focus 
        // baseados em estado de React DENTRO do CSS.
        return {
            ...(isHovered ? hoverStyle : {}),
            ...(isActive ? activeStyle : {}),
            // A borda inferior deve ser controlada aqui para remover no último item, se necessário.
            // borderBottom: (index === navLinks.length - 1) ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        };
    };

    const isSubmenuActive = (sublinks) => {
        return sublinks.some(sublink => location.pathname.startsWith(sublink.path));
    };

    const getSubmenuNavStyle = (link) => {
        const isActive = isSubmenuActive(link.sublinks);
        const isHovered = hoveredPath === link.id;

        const activeStyle = {
            backgroundColor: colors.secondaryGreen,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        };
        const hoverStyle = {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
        };

        return { ...(isHovered ? hoverStyle : {}), ...(isActive ? activeStyle : {}) };
    };


    return (
        <div className={styles.appContainer}>

            {isMobileMenuOpen && (
                <div className={styles.overlay} onClick={closeMobileMenu}></div>
            )}

            {/* Sidebar (Navegação) */}
            {/* 💡 Adiciona a classe 'mobileOpen' condicionalmente */}
            <aside 
                className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}
                aria-hidden={!isMobileMenuOpen}
                style={{ display: (isSidebarCollapsed && !isMobileMenuOpen) ? 'none' : undefined }}
            >
                <button className={styles.closeButton} onClick={closeMobileMenu} aria-label="Fechar menu">
                    &times;
                </button>
                <h1 className={styles.logo}>FISIO<span className={styles.logoHighlight}>APP</span></h1>
                
                {/* 💡 Substitui styles.nav */}
                <nav className={styles.nav}>
                    {navLinks.map((link, index) => (link.sublinks ? (
                        <div key={link.id}>
                            <div
                                className={styles.navLink}
                                style={{ ...getSubmenuNavStyle(link), cursor: 'pointer' }}
                                onClick={() => toggleSubmenu(link.id)}
                                onMouseEnter={() => setHoveredPath(link.id)}
                                onMouseLeave={() => setHoveredPath(null)}
                            >
                                <span className={styles.navIcon}>{link.icon}</span>
                                {link.label}
                                <span style={{ float: 'right', transition: 'transform 0.2s', transform: openSubmenu === link.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                            </div>
                            {openSubmenu === link.id && (
                                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '0 0 8px 8px' }}>
                                    {link.sublinks.map(sublink => (
                                        <Link
                                            key={sublink.path}
                                            to={sublink.path}
                                            className={styles.navLink}
                                            style={{ ...getNavLinkClasses(sublink.path, -1), paddingLeft: '50px', fontSize: '0.9em' }}
                                            onMouseEnter={() => setHoveredPath(sublink.path)}
                                            onMouseLeave={() => setHoveredPath(null)}
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
                            className={styles.navLink}
                            style={getNavLinkClasses(link.path, index)}
                            onMouseEnter={() => setHoveredPath(link.path)}
                            onMouseLeave={() => setHoveredPath(null)}
                            onClick={closeMobileMenu}
                        ><span className={styles.navIcon}>{link.icon}</span>{link.label}</Link>
                    )))}
                </nav>
                
                {/* 💡 Substitui styles.sidebarFooter */}
                <div className={styles.sidebarFooter}>
                    {/* 💡 Substitui styles.userInfoSidebar */}
                    <p className={styles.userInfoSidebar}>
                        Logado como: <span style={{fontWeight: 'bold'}}>{usuario?.nome || 'Admin'}</span>
                    </p>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            {/* 💡 Substitui styles.mainContent */}
            <main 
                className={styles.mainContent}
                style={{ marginLeft: isSidebarCollapsed ? 0 : undefined, width: isSidebarCollapsed ? '100%' : undefined }}
            >
                {/* Cabeçalho */}
                {/* 💡 Substitui styles.header */}
                <header className={styles.header}>
                    {/* 💡 Botão de Toggle do Menu (Visível no Header) */}
                    <button 
                        onClick={handleToggleSidebar}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px', color: '#333' }}
                        title={isSidebarCollapsed ? "Abrir Menu" : "Fechar Menu"}
                    >
                        ☰
                    </button>

                    {/* 💡 Substitui styles.userInfo */}
                    <div className={styles.userInfo}>
                        Sistema de Gestão Clínica Integrada.
                    </div>
                    {/* Estilização do botão de Sair com Hover */}
                    <button 
                        onClick={signOut} 
                        // 💡 HOVER/ESTILOS DINÂMICOS: Mantemos a classe base e permitimos o hover via CSS :hover
                        className={styles.logoutButton}
                        // O controle de hover via estado do React NÃO É MAIS NECESSÁRIO
                        // setHoveredPath('logout') e styles.logoutButtonHover podem ser removidos.
                        // Mas, para ser fiel ao seu código original, vou simplificar o hover.
                    >
                        <span style={{marginRight: '8px'}}>🚪</span> Sair
                    </button>
                </header>
                
                {/* O Outlet renderiza o conteúdo da rota filha */}
                {/* 💡 Substitui styles.pageContent */}
                <div className={styles.pageContent}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

// 💡 4. O objeto 'styles' foi REMOVIDO daqui.