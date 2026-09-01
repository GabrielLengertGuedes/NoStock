import { useState } from 'react'

import { ModalMovimentacao } from '../components/ModalMovimentacao.jsx'
import { Layout } from '../components/Layout.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

export function Dashboard() {
  const menu = useMenuPrincipal()
  const [modal, setModal] = useState(null)

  return (
    <Layout titulo="Dashboard" menu={menu}>
      <section className="dashboard-atalhos card">
        <p className="text-body" style={{ color: 'var(--slate)' }}>
          Registre entradas e saídas de estoque em poucos cliques.
        </p>
        <div className="dashboard-atalhos-botoes">
          <button type="button" className="btn btn-accent" onClick={() => setModal('ENTRADA')}>
            Registrar entrada
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setModal('SAIDA')}>
            Registrar saída
          </button>
        </div>
      </section>

      {modal && (
        <ModalMovimentacao aberto tipo={modal} aoFechar={() => setModal(null)} />
      )}
    </Layout>
  )
}
