import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx' // Importe o AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* Envolve a aplicação com o provedor de autenticação */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)