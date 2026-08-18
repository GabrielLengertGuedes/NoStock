import { NavLink } from 'react-router-dom'

export function Layout({ titulo, acoes, menu = [], children }) {
  return (
    <div className="layout">
      <header className="layout-cabecalho">
        <span className="text-h3 layout-marca">NoStock</span>

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
