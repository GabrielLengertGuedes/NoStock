import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { useMovimentacoes } from '../api/movimentacoes.js'
import { useProdutos } from '../api/produtos.js'
import { BadgeStatus } from '../components/BadgeStatus.jsx'
import { FabBioma } from '../components/FabBioma.jsx'
import { IconeAlerta, IconeCaixaVazia, IconeMovimentacoes, IconeProdutos } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { MenuAcoes } from '../components/MenuAcoes.jsx'
import { ModalMovimentacao } from '../components/ModalMovimentacao.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { skuDoProduto } from '../lib/sku.js'

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function totalDe(consulta) {
  return consulta.data?.meta?.total ?? 0
}

function inicioDoDiaLocal() {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return data.toISOString()
}

function formatarReposicao(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return DATA_CURTA.format(data)
}

export function Dashboard() {
  const menu = useMenuPrincipal()
  const { usuario } = useAuth()
  const [modal, setModal] = useState(null)

  const total = useProdutos({ pagina: 1, porPagina: 1 })
  const baixos = useProdutos({ status: 'BAIXO', pagina: 1, porPagina: 1 })
  const criticos = useProdutos({ status: 'CRITICO', pagina: 1, porPagina: 1 })
  const zerados = useProdutos({ status: 'SEM_ESTOQUE', pagina: 1, porPagina: 1 })
  const resumo = useProdutos({ pagina: 1, porPagina: 10 })
  const atencao = useProdutos({ status: 'PRECISA_REPOR', pagina: 1, porPagina: 10 })
  const entradasHoje = useMovimentacoes({
    tipo: 'ENTRADA',
    de: inicioDoDiaLocal(),
    pagina: 1,
    porPagina: 1,
  })
  const entradasRecentes = useMovimentacoes({
    tipo: 'ENTRADA',
    pagina: 1,
    porPagina: 100,
  })

  const produtosResumo = resumo.data?.dados ?? []
  const produtosAtencao = atencao.data?.dados ?? []
  const alertas = produtosAtencao.slice(0, 3)
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'de volta'
  const totalItens = totalDe(total)
  const totalBaixo = totalDe(baixos) + totalDe(criticos)
  const totalZerado = totalDe(zerados)
  const totalEntradasHoje = totalDe(entradasHoje)
  const emAtencao = totalDe(atencao)
  const percentualOtimo =
    totalItens > 0 ? Math.max(0, Math.round(((totalItens - emAtencao) / totalItens) * 100)) : 100

  const ultimaEntradaPorProduto = useMemo(() => {
    const mapa = new Map()
    for (const mov of entradasRecentes.data?.dados ?? []) {
      const produtoId = mov.produto?.id ?? mov.produtoId
      if (produtoId == null || mapa.has(produtoId)) continue
      mapa.set(produtoId, mov.criadoEm)
    }
    return mapa
  }, [entradasRecentes.data])

  const valorEmRisco = produtosAtencao.reduce((acc, p) => {
    const preco = Number(p.precoVenda) || 0
    const faltando = Math.max(0, (p.estoqueMinimo ?? 0) - (p.quantidadeAtual ?? 0))
    return acc + faltando * preco
  }, 0)

  const cards = [
    {
      chave: 'total',
      rotulo: 'Total de itens',
      valor: totalItens,
      meta: <span className="kpi-pill kpi-pill-ok">Catálogo ativo</span>,
      tom: 'neutro',
      Icone: IconeProdutos,
      barra: 100,
    },
    {
      chave: 'baixo',
      rotulo: 'Estoque baixo',
      valor: totalBaixo,
      meta: <span className="kpi-pill kpi-pill-warn">ATENÇÃO</span>,
      tom: 'alerta',
      Icone: IconeAlerta,
      barra: totalItens ? Math.round((totalBaixo / totalItens) * 100) : 0,
    },
    {
      chave: 'zerado',
      rotulo: 'Sem estoque',
      valor: totalZerado,
      meta: <span className="kpi-pill kpi-pill-danger">Urgente</span>,
      tom: 'urgente',
      Icone: IconeCaixaVazia,
      barra: totalItens ? Math.round((totalZerado / totalItens) * 100) : 0,
    },
    {
      chave: 'entradas',
      rotulo: 'Entradas (hoje)',
      valor: totalEntradasHoje,
      meta: (
        <Link to="/movimentacoes?tipo=ENTRADA" className="text-body-sm" style={{ color: 'var(--primary-medium)' }}>
          Ver histórico
        </Link>
      ),
      tom: 'mint',
      Icone: IconeMovimentacoes,
    },
  ]

  const colunas = [
    {
      chave: 'nome',
      titulo: 'Produto',
      render: (p) => (
        <div className="produto-celula">
          <ProdutoThumb id={p.id} nome={p.nome} categoria={p.categoria?.nome} />
          <div>
            <p className="produto-nome">{p.nome}</p>
            <p className="produto-meta">{skuDoProduto(p)}</p>
          </div>
        </div>
      ),
    },
    {
      chave: 'categoria',
      titulo: 'Categoria',
      render: (p) => <span className="categoria-pill">{p.categoria?.nome ?? '—'}</span>,
    },
    {
      chave: 'quantidadeAtual',
      titulo: 'Quantidade',
      render: (p) => (
        <div className={`qtd-celula${p.quantidadeAtual <= (p.estoqueMinimo ?? 0) ? ' qtd-baixa' : ''}`}>
          <strong>{p.quantidadeAtual} un</strong>
          <span>Mínimo: {p.estoqueMinimo ?? 0} un</span>
        </div>
      ),
    },
    {
      chave: 'ultimaReposicao',
      titulo: 'Última reposição',
      render: (p) => (
        <span className="text-mono text-body-sm">{formatarReposicao(ultimaEntradaPorProduto.get(p.id))}</span>
      ),
    },
    {
      chave: 'statusEstoque',
      titulo: 'Status',
      render: (p) => <BadgeStatus status={p.statusEstoque} />,
    },
    {
      chave: 'acoes',
      titulo: '',
      alinhamento: 'right',
      render: (p) => (
        <MenuAcoes
          rotulo={`Ações de ${p.nome}`}
          itens={[
            { rotulo: 'Registrar entrada', onClick: () => setModal({ tipo: 'ENTRADA', produto: p }) },
            { rotulo: 'Registrar saída', onClick: () => setModal({ tipo: 'SAIDA', produto: p }) },
          ]}
        />
      ),
    },
  ]

  return (
    <Layout
      titulo={`Bem-vindo de volta, ${primeiroNome}!`}
      subtitulo={`Seu inventário está ${percentualOtimo}% otimizado. Priorize os alertas e registre entradas e saídas.`}
      menu={menu}
    >
      <section className="kpi-grid" aria-label="Resumo do estoque">
        {cards.map((card) => (
          <KpiCard key={card.chave} {...card} />
        ))}
      </section>

      <section className="painel">
        <div className="painel-cabecalho">
          <div>
            <h2 className="text-h3">Controle de inventário</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Resumo dos produtos cadastrados no estoque.
            </p>
          </div>
          <div className="flex gap-sm">
            <Link to="/produtos" className="btn btn-secondary">
              Ver todos
            </Link>
            <Link to="/produtos/novo" className="btn btn-primary">
              + Novo produto
            </Link>
          </div>
        </div>

        <Tabela
          colunas={colunas}
          dados={produtosResumo}
          chaveDaLinha={(p) => p.id}
          carregando={resumo.isLoading}
          vazio="Nenhum produto cadastrado ainda."
        />
      </section>

      <section className="dashboard-grid-baixo">
        <div className="painel">
          <div className="painel-cabecalho">
            <h2 className="text-h3">Alertas de reposição</h2>
          </div>
          {alertas.length === 0 ? (
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Nenhum alerta no momento.
            </p>
          ) : (
            alertas.map((produto) => (
              <article
                key={produto.id}
                className={`alerta-item${produto.statusEstoque === 'SEM_ESTOQUE' ? ' alerta-item-critico' : ''}`}
              >
                <div>
                  <p className="produto-nome">{produto.nome}</p>
                  <p className="produto-meta">
                    {produto.statusEstoque === 'SEM_ESTOQUE'
                      ? 'Esgotado'
                      : `${produto.quantidadeAtual} un restantes`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: 'var(--primary-medium)', fontWeight: 700 }}
                  onClick={() => setModal({ tipo: 'ENTRADA', produto })}
                >
                  Pedir agora
                </button>
              </article>
            ))
          )}
        </div>

        <aside className="insight-card">
          <p className="text-micro" style={{ opacity: 0.75, marginBottom: 8 }}>
            Insights
          </p>
          <p className="kpi-valor kpi-valor-sm" style={{ color: 'inherit' }}>
            {MOEDA.format(valorEmRisco)}
          </p>
          <p>
            {valorEmRisco > 0
              ? 'Valor abaixo do mínimo — priorize a reposição para evitar ruptura.'
              : 'Nenhum valor em risco no momento. Continue acompanhando as entradas e saídas do dia.'}
          </p>
          <Link to="/produtos?status=PRECISA_REPOR" className="btn">
            Ver produtos em atenção
          </Link>
        </aside>
      </section>

      <FabBioma onClick={() => setModal({ tipo: 'ENTRADA' })} />

      {modal && (
        <ModalMovimentacao
          aberto
          tipo={modal.tipo}
          produtoInicial={modal.produto ?? null}
          aoFechar={() => setModal(null)}
        />
      )}
    </Layout>
  )
}
