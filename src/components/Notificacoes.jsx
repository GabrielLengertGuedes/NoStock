import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useDashboard } from '../api/dashboard.js'
import { BadgeStatus } from './BadgeStatus.jsx'
import { IconeSino } from './IconesBioma.jsx'
import { ProdutoThumb } from './ProdutoThumb.jsx'

const MAX_ITENS = 5

/**
 * Sino da topbar: contador de produtos que precisam de reposição e a fila dos
 * mais urgentes. Lê o mesmo GET /dashboard dos cards (cache compartilhado),
 * já ordenado por prioridade: sem estoque, crítico, baixo.
 */
export function Notificacoes() {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef(null)
  const id = useId()
  const dashboard = useDashboard()

  const cards = dashboard.data?.cards
  const total = (cards?.estoqueBaixo ?? 0) + (cards?.semEstoque ?? 0)
  const itens = (dashboard.data?.produtosAtencao ?? []).slice(0, MAX_ITENS)
  const rotulo = total > 0 ? `Alertas de estoque: ${total} produto(s) para repor` : 'Alertas de estoque'

  useEffect(() => {
    if (!aberto) return undefined

    function fecharFora(evento) {
      if (raiz.current && !raiz.current.contains(evento.target)) setAberto(false)
    }
    function fecharEsc(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', fecharFora)
    document.addEventListener('keydown', fecharEsc)
    return () => {
      document.removeEventListener('mousedown', fecharFora)
      document.removeEventListener('keydown', fecharEsc)
    }
  }, [aberto])

  function fechar() {
    setAberto(false)
  }

  return (
    <div className="notificacoes" ref={raiz}>
      <button
        type="button"
        className="layout-icone-btn"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls={id}
        title="Alertas de estoque"
        onClick={() => setAberto((v) => !v)}
      >
        <IconeSino size={18} />
        {total > 0 && (
          <span className="notificacoes-contador" aria-hidden="true">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      <section id={id} className="notificacoes-painel" aria-label="Alertas de estoque" hidden={!aberto}>
        <header className="notificacoes-cabecalho">
          <p className="notificacoes-titulo">Alertas de estoque</p>
          <p className="notificacoes-resumo">
            {dashboard.isPending
              ? 'Carregando…'
              : total > 0
                ? `${total} ${total === 1 ? 'produto precisa' : 'produtos precisam'} de reposição`
                : 'Tudo em dia'}
          </p>
        </header>

        {dashboard.isError ? (
          <p className="notificacoes-vazio campo-erro">{dashboard.error.mensagem}</p>
        ) : !dashboard.isPending && itens.length === 0 ? (
          <p className="notificacoes-vazio">Nenhum produto abaixo do estoque mínimo.</p>
        ) : (
          <ul className="notificacoes-lista">
            {itens.map((produto) => (
              <li key={produto.id}>
                <Link
                  to={`/produtos?busca=${encodeURIComponent(produto.nome)}`}
                  className="notificacoes-item"
                  onClick={fechar}
                >
                  <ProdutoThumb id={produto.id} nome={produto.nome} categoria={produto.categoria?.nome} />
                  <span className="notificacoes-item-texto">
                    <span className="produto-nome">{produto.nome}</span>
                    <span className="produto-meta">
                      {produto.quantidadeAtual} un · mínimo {produto.estoqueMinimo ?? 0}
                    </span>
                  </span>
                  <BadgeStatus status={produto.statusEstoque} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <Link to="/produtos?status=PRECISA_REPOR" className="notificacoes-rodape" onClick={fechar}>
            Ver todos os alertas
          </Link>
        )}
      </section>
    </div>
  )
}
