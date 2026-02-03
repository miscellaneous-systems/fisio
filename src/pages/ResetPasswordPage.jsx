// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import styles from './LoginPage.module.css';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Captura o token da URL (ex: http://localhost:3000/redefinir-senha?token=XYZ)
    const token = searchParams.get('token');

    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (novaSenha !== confirmarSenha) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (novaSenha.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/reset-password', { 
                token, 
                novaSenha 
            });
            
            setMessage('Senha redefinida com sucesso! Redirecionando para o login...');
            
            // Redireciona após 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'O link é inválido ou expirou.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <h2 style={{color: '#e74c3c'}}>Link Inválido</h2>
                    <p style={{textAlign: 'center', marginBottom: '20px'}}>
                        O link de recuperação é inválido ou está ausente.
                    </p>
                    <button onClick={() => navigate('/login')} className={styles.loginButton}>
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2>Redefinir Senha</h2>
                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>
                    Crie uma nova senha para sua conta.
                </p>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <input
                        type="password"
                        placeholder="Nova Senha"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className={styles.loginInput}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirmar Nova Senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
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
                        {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
