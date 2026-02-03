// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
// Reutiliza os estilos de login para manter a identidade visual
import styles from './LoginPage.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Chama a rota de solicitação do backend
            await api.post('/auth/forgot-password', { email });
            setMessage('Se o e-mail estiver cadastrado, enviamos um link de recuperação para ele.');
        } catch (err) {
            console.error(err);
            // Exibe mensagem de erro vinda do backend ou genérica
            if (err.response?.status === 404) {
                setError('Erro 404: Rota não encontrada. Se estiver usando a URL do Render, faça o DEPLOY do backend.');
            } else {
                setError(err.response?.data?.message || 'Erro ao solicitar recuperação. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2>Recuperar Senha</h2>
                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>
                    Digite seu e-mail abaixo para receber as instruções de redefinição de senha.
                </p>
                
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <input
                        type="email"
                        placeholder="Seu e-mail cadastrado"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.loginInput}
                        required
                    />

                    {message && (
                        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                    
                    {error && <p className={styles.loginError}>{error}</p>}

                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link to="/login" style={{ color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}>
                            &larr; Voltar para o Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
