import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css'; 

const RegisterPage = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        // Validações básicas
        if (!nome || !email || !senha || !confirmarSenha) {
            setErro('Por favor, preencha todos os campos.');
            setLoading(false);
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            // A função signUp deve ser implementada no seu AuthContext
            // e deve retornar sucesso/falha ou lançar um erro.
            await signUp(nome, email, senha);
            
            alert('Conta criada com sucesso! Você será redirecionado para a página de login.');
            navigate('/login');

        } catch (error) {
            console.error("Erro no registro:", error);
            setErro(error.message || 'Falha ao criar a conta. O e-mail já pode estar em uso.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h2>Criar Nova Conta</h2>
                <h3>Acesso de Fisioterapeuta</h3>
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className={styles.loginInput}
                        required
                    />
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
                        placeholder="Senha (mín. 6 caracteres)"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={styles.loginInput}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirmar Senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className={styles.loginInput}
                        required
                    />

                    {erro && <p className={styles.loginError}>{erro}</p>}
                    
                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Registrando...' : 'Criar Conta'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em' }}>
                        Já tem uma conta? <Link to="/login">Faça login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;