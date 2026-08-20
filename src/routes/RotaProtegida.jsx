import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext.jsx'

export function RotaProtegida({ children, papel }) {
  const { autenticado, carregando, loginExigido, temPapel } = useAuth()
  const localizacao = useLocation()

  if (carregando) {
    return (
      <div className="container mt-base text-center">
        <p className="text-body" style={{ color: 'var(--slate)' }}>
          Carregando sessão…
        </p>
      </div>
    )
  }

  // Sessão caiu no meio do uso: mantém a tela por baixo e o Login cobre (RN12).
  if (!autenticado && loginExigido) {
    return children
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: localizacao }} />
  }

  if (papel && !temPapel(papel)) {
    return (
      <div className="container mt-base text-center">
        <h1 className="text-h2">Sem permissão</h1>
        <p className="text-body" style={{ color: 'var(--slate)' }}>
          Esta área é restrita a gestores.
        </p>
      </div>
    )
  }

  return children
}
