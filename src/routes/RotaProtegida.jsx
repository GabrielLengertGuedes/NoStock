import { Link, Navigate, useLocation } from 'react-router-dom'

import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

function SemPermissao() {
  const menu = useMenuPrincipal()
  return (
    <Layout menu={menu} esconderTitulo>
      <EstadoVazio
        titulo="Sem permissão"
        descricao="Esta área é restrita a gestores."
        acao={
          <Link to="/dashboard" className="btn btn-primary">
            Voltar ao dashboard
          </Link>
        }
      />
    </Layout>
  )
}

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
    return <SemPermissao />
  }

  return children
}
