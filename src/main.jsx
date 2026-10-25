import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import { queryClient } from './api/queryClient.js'
import { AuthProvider } from './contexts/AuthProvider.jsx'
import { ToastProvider } from './contexts/ToastProvider.jsx'
import { ouvirMudancasDeEstoque, registrarServiceWorker } from './lib/pwa.js'
import { Rotas } from './routes/Rotas.jsx'

registrarServiceWorker()
ouvirMudancasDeEstoque(() => queryClient.invalidateQueries())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Rotas />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
