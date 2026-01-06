// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext({});

function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    // Efeito para carregar o token do localStorage ao iniciar
    useEffect(() => {
        const token = localStorage.getItem('@FisioToken');
        const userData = localStorage.getItem('@FisioUser');

        if (token && userData) {
            try {
                // Se houver token, define o usuário e o token global no Axios
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUsuario(JSON.parse(userData));
            } catch (error) {
                console.error("Erro ao restaurar sessão:", error);
                localStorage.removeItem('@FisioToken');
                localStorage.removeItem('@FisioUser');
            }
        }
        setLoading(false);
    }, []);

    async function signIn(email, senha) {
        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, nome, usuarioId } = response.data;
            
            const userData = { id: usuarioId, nome, email };

            localStorage.setItem('@FisioToken', token);
            localStorage.setItem('@FisioUser', JSON.stringify(userData));
            
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUsuario(userData);
            return true;
        } catch (error) {
            console.error("Login falhou:", error.response.data.message);
            return false;
        }
    }

    function signOut() {
        localStorage.removeItem('@FisioToken');
        localStorage.removeItem('@FisioUser');
        delete api.defaults.headers.common['Authorization'];
        setUsuario(null);
    }

    if (loading) {
        return <div>Carregando...</div>; // Tela de carregamento enquanto verifica o token
    }

    return (
        <AuthContext.Provider value={{ signed: !!usuario, usuario, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);
    return context;
}

export { AuthProvider, useAuth };