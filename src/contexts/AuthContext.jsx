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

    async function signUp(nome, email, senha) {
        try {
            // A rota para registro pode variar (ex: /users, /register, /auth/register)
            // Estou usando /auth/register para manter o padrão do login.
            // O backend deve esperar um objeto com { nome, email, senha }.
            await api.post('/auth/register', { nome, email, senha });
            // A função não precisa retornar nada em caso de sucesso,
            // pois a RegisterPage irá redirecionar o usuário.
        } catch (error) {
            // Se o backend retornar uma mensagem de erro (ex: e-mail já existe),
            // ela estará em error.response.data.message.
            // Lançar o erro permite que o componente RegisterPage o capture e exiba.
            console.error("Falha no registro:", error.response?.data?.message || error.message);
            throw error; // Lança o erro para ser tratado no componente
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
        <AuthContext.Provider value={{ signed: !!usuario, usuario, signIn, signOut, signUp }}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);
    return context;
}

export { AuthProvider, useAuth };