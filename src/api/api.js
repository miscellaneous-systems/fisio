// src/api/api.js
import axios from 'axios';

// ⚠️ Mude a URL base para o endereço do seu backend (porta 3000)
const api = axios.create({
    baseURL: 'http://localhost:3000/api', 
});

// Interceptor para adicionar o token JWT a todas as requisições
api.interceptors.request.use(config => {
    const token = localStorage.getItem('@FisioToken'); 
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // Não exibe o aviso se for a rota de login
        if (!config.url.includes('/login')) {
            console.warn('⚠️ Token não encontrado no localStorage. Verifique se fez login.');
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403) {
            console.error('❌ Acesso Negado (403): Token inválido ou expirado');
            // Opcional: Fazer logout automático
            // localStorage.removeItem('@FisioToken');
            // localStorage.removeItem('@FisioUser');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;