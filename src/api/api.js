// src/api/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Interceptor JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('@FisioToken'); 
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de erro
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403) {
            console.error('❌ Token inválido ou expirado');
        }
        return Promise.reject(error);
    }
);

export default api;
