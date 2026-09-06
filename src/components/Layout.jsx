import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { IconeBusca, IconeSino } from './IconesBioma.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function Layout({
  titulo,
  subtitulo,
  acoes,
  menu = [],
  children,
  buscaPlaceholder = 'Buscar produtos, categorias…',
  onBusca,
  esconderTitulo = false,
}) {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')

  const inicial = usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || '?'
  const papel =
    usuario?.papel === 'GESTOR' ? 'Gerente da loja' : usuario?.papel === 'OPERADOR' ? 'Operador' : ''

  function enviarBusca(evento) {
    evento.preventDefault()
    if (typeof onBusca === 'function') {
      onBusca(busca)
      return
    }
    const termo = busca.trim()
    if (termo) navegar(`/produtos?busca=${encodeURIComponent(termo)}`)
  }

  return (
    <div className="layout-app">
      <aside className="layout-sidebar" aria-label="Navegação principal">
        <div className="layout-sidebar-topo">
          <div className="layout-brand">
            <span className="layout-brand-icone" aria-hidden="true">
              <img src="/brand/logo-paw.svg" alt="" width={22} height={22} />
            </span>
            <div>
              <p className="layout-brand-nome">Bioma PetShop</p>
              <p className="layout-brand-sub">Gestão de inventário</p>
            </div>
          </div>

          <nav className="layout-nav">
            {menu.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                className={({ isActive }) =>
                  isActive ? 'layout-nav-item layout-nav-item-ativo' : 'layout-nav-item'
                }
              >
                {item.Icone && (
                  <span className="layout-nav-icone" aria-hidden="true">
                    <item.Icone size={18} />
                  </span>
                )}
                <span>{item.rotulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {usuario && (
          <div className="layout-sidebar-rodape">
            <div className="layout-sidebar-usuario">
              <span className="layout-avatar" aria-hidden="true">
                {inicial}
              </span>
              <div>
                <p className="layout-sidebar-usuario-nome">{usuario.nome}</p>
                {papel && <p className="layout-sidebar-usuario-papel">{papel}</p>}
              </div>
            </div>
            <button type="button" className="btn-ghost-sidebar" onClick={() => logout()}>
              Sair
            </button>
          </div>
        )}
      </aside>

      <div className="layout-principal">
        <header className="layout-topbar">
          <form className="layout-busca" onSubmit={enviarBusca} role="search">
            <IconeBusca size={16} className="layout-busca-icone" />
            <input
              type="search"
              className="layout-busca-campo"
              placeholder={buscaPlaceholder}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Busca"
            />
          </form>

          <div className="layout-topbar-direita">
            <button
              type="button"
              className="layout-icone-btn"
              aria-label="Notificações"
              title="Alertas de estoque"
              onClick={() => navegar('/produtos?status=PRECISA_REPOR')}
            >
              <IconeSino size={18} />
            </button>
            {usuario && (
              <span className="layout-avatar layout-avatar-sm" aria-hidden="true" title={usuario.nome}>
                {inicial}
              </span>
            )}
          </div>
        </header>

        <main className="layout-conteudo">
          {!esconderTitulo && (
            <div className="layout-titulo">
              <div>
                <h1 className="layout-titulo-texto">{titulo}</h1>
                {subtitulo && <p className="layout-subtitulo">{subtitulo}</p>}
              </div>
              {acoes ? <div className="layout-acoes">{acoes}</div> : null}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
