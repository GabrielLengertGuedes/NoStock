import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useDashboard } from '../../api/dashboard.js'
import { useProdutosEmRolagem } from '../../api/produtos.js'
import { IconeBusca } from '../../components/IconesBioma.jsx'
import { Chips } from '../../components/movel/Chips.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { LinhaProduto } from '../../components/movel/LinhaProduto.jsx'
import { useAoPararDeDigitar } from '../../hooks/useAoPararDeDigitar.js'

const STATUS = ['', 'PRECISA_REPOR', 'SEM_ESTOQUE']
const POR_PAGINA = 20

function subtitulo(total, filtrando) {
  if (total == null) return 'Carregando…'
  const produtos = total === 1 ? 'produto' : 'produtos'
  return filtrando ? `${total} ${produtos} no filtro` : `${total} ${produtos} ativos`
}

/** Catálogo em cartões. O filtro vem da URL para os números do Início abrirem já filtrado. */
export function EstoqueMovel() {
  const [parametros, setParametros] = useSearchParams()
  const status = STATUS.includes(parametros.get('status')) ? parametros.get('status') : ''

  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const adiada = useAoPararDeDigitar((valor) => setBusca(valor.trim()))

  const cards = useDashboard().data?.cards
  const consulta = useProdutosEmRolagem({
    busca: busca || undefined,
    status: status || undefined,
    porPagina: POR_PAGINA,
  })
  const produtos = consulta.data?.pages.flatMap((pagina) => pagina.dados) ?? []
  const total = consulta.data?.pages[0]?.meta.total

  const opcoes = [
    { valor: '', rotulo: 'Todos' },
    {
      valor: 'PRECISA_REPOR',
      rotulo: 'Precisa repor',
      contagem: cards ? cards.estoqueBaixo + cards.semEstoque : null,
    },
    { valor: 'SEM_ESTOQUE', rotulo: 'Sem estoque', contagem: cards?.semEstoque },
  ]

  function mudarStatus(valor) {
    setParametros(valor ? { status: valor } : {}, { replace: true })
  }

  return (
    <LayoutMovel titulo="Estoque" subtitulo={subtitulo(total, Boolean(status || busca))} comRegistrar>
      <div className="movel-busca" role="search">
        <IconeBusca size={18} />
        <input
          type="search"
          placeholder="Buscar produto"
          aria-label="Buscar produto pelo nome"
          autoComplete="off"
          enterKeyHint="search"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            adiada.agendar(evento.target.value)
          }}
        />
      </div>

      <Chips rotulo="Filtrar por situação" opcoes={opcoes} valor={status} aoMudar={mudarStatus} />

      {consulta.isError ? (
        <p className="movel-erro" role="alert">
          {consulta.error.mensagem}
        </p>
      ) : consulta.isPending ? (
        <p className="movel-carregando">Carregando…</p>
      ) : produtos.length === 0 ? (
        <div className="movel-vazio">
          <strong>Nenhum produto encontrado</strong>
          {busca ? 'Confira o nome ou tente só uma parte dele.' : 'Nenhum produto nessa situação.'}
        </div>
      ) : (
        <ul className="movel-lista">
          {produtos.map((produto) => (
            <li key={produto.id}>
              <LinhaProduto produto={produto} />
            </li>
          ))}
        </ul>
      )}

      {consulta.hasNextPage ? (
        <button
          type="button"
          className="movel-botao movel-botao-secundario movel-mais"
          onClick={() => consulta.fetchNextPage()}
          disabled={consulta.isFetchingNextPage}
        >
          {consulta.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </button>
      ) : null}
    </LayoutMovel>
  )
}
