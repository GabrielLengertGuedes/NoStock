import { NavLink } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.js'

export function Layout({ titulo, acoes, menu = [], children }) {
  const { usuario, logout } = useAuth()

  return (
    <div className="layout">
      <header className="layout-cabecalho">
        <span className="text-h3 layout-marca">NoStock</span>

        <div className="layout-cabecalho-direita">
          {menu.length > 0 && (
            <nav className="nav-pill" aria-label="Seções do sistema">
              {menu.map((item) => (
                <NavLink
                  key={item.para}
                  to={item.para}
                  className={({ isActive }) => (isActive ? 'nav-item nav-item-ativo' : 'nav-item')}
                >
                  {item.rotulo}
                </NavLink>
              ))}
            </nav>
          )}

          {usuario && (
            <div className="layout-usuario">
              <span className="text-body-sm" style={{ color: 'var(--slate)' }}>
                {usuario.nome}
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => logout()}>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container layout-conteudo">
        <div className="layout-titulo">
          <h1 className="text-h2">{titulo}</h1>
          {acoes}
        </div>
        {children}
      </main>
    </div>
  )
}
