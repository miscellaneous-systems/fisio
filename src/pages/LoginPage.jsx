import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        const success = await signIn(email, senha);
        if (success) {
            navigate('/');
        } else {
            setErro('Email ou senha inválidos.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2>Fisio | Clínica</h2>
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

                    <div className={styles.forgotPasswordContainer}>
                        <button 
                            type="button" 
                            onClick={() => navigate('/forgot-password')}
                            className={styles.textLink}
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    {erro && <p className={styles.loginError}>{erro}</p>} 
                    
                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    <button 
                        type="button" 
                        className={`${styles.loginButton} ${styles.registerButton}`} 
                        onClick={() => navigate('/register')}
                    >
                        Registre-se
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;