// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// ✅ A importação de CSS Modules está correta
import styles from './LoginPage.module.css';

const LoginPage = () => {
    // 1. Estados locais para o formulário
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    // 2. Hook de autenticação e navegação
    const { signIn } = useAuth();
    const navigate = useNavigate();

    // 3. Função de submissão do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(''); // Limpa erros anteriores

        // Validação básica
        if (!email || !senha) {
            setErro('Preencha todos os campos!');
            setLoading(false);
            return;
        }

        // Tenta fazer login usando a função do Context
        const success = await signIn(email, senha);

        if (success) {
            navigate('/');
        } else {
            setErro('Email ou senha inválidos. Tente novamente.');
        }

        setLoading(false);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2>Clínica Fisio & Pilates</h2>
                <h3>Acesso de Fisioterapeuta</h3>
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.loginInput}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={styles.loginInput} 
                        required
                    />

                    {erro && <p className={styles.loginError}>{erro}</p>} 
                    <button 
                        type="submit" 
                        className={styles.loginButton} 
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;