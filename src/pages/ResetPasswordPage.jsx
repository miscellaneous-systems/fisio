// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Certifique-se que o caminho está correto
import styles from './LoginPage.module.css';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [sessaoValida, setSessaoValida] = useState(false);
    const [verificando, setVerificando] = useState(true);

    useEffect(() => {
        // O Supabase processa o hash da URL (#access_token=...) automaticamente.
        // Aqui verificamos se isso resultou em uma sessão válida.
        const verificarSessao = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                setSessaoValida(true);
            } else {
                // Tenta ouvir a mudança de estado caso o processamento do hash seja lento
                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                    if (session) {
                        setSessaoValida(true);
                    }
                    setVerificando(false);
                });
                return () => subscription.unsubscribe();
            }
            setVerificando(false);
        };

        verificarSessao();
    }, []);

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
            // Com o usuário logado pelo link, apenas atualizamos o usuário
            const { error } = await supabase.auth.updateUser({
                password: novaSenha
            });

            if (error) throw error;
            
            setMessage('Senha redefinida com sucesso! Redirecionando para o login...');

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao redefinir a senha.');
        } finally {
            setLoading(false);
        }
    };

    if (verificando) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <p style={{textAlign: 'center'}}>Verificando link de segurança...</p>
                </div>
            </div>
        );
    }

    if (!sessaoValida) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <h2 style={{color: '#e74c3c'}}>Link Inválido ou Expirado</h2>
                    <p style={{textAlign: 'center', marginBottom: '20px'}}>
                        O link de recuperação já foi utilizado ou expirou. Por favor, solicite uma nova redefinição.
                    </p>
                    <button onClick={() => navigate('/login')} className={styles.loginButton}>
                        Voltar para Login
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
                    Digite sua nova senha abaixo.
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
