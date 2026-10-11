import { useState } from 'react'

import { useMovimentacoesEmRolagem } from '../../api/movimentacoes.js'
import { Chips } from '../../components/movel/Chips.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { LinhaMovimentacao } from '../../components/movel/LinhaMovimentacao.jsx'
import { rotuloDoDia } from '../../lib/datas.js'

const TIPOS = [
  { valor: '', rotulo: 'Tudo' },
  { valor: 'ENTRADA', rotulo: 'Entradas' },
  { valor: 'SAIDA', rotulo: 'Saídas' },
]

// A API já entrega da mais nova para a mais antiga: basta cortar quando o dia muda.
function agruparPorDia(movimentacoes, agora) {
  const dias = []
  for (const movimentacao of movimentacoes) {
    const rotulo = rotuloDoDia(movimentacao.criadoEm, agora)
    const ultimo = dias.at(-1)
    if (ultimo?.rotulo === rotulo) ultimo.itens.push(movimentacao)
    else dias.push({ rotulo, itens: [movimentacao] })
  }
  return dias
}

/** As movimentações mais recentes. Período, usuário e motivo ficam na versão completa. */
export function HistoricoMovel() {
  const [tipo, setTipo] = useState('')
  const [agora] = useState(() => new Date())
  const consulta = useMovimentacoesEmRolagem({ tipo: tipo || undefined, porPagina: 30 })
  const movimentacoes = consulta.data?.pages.flatMap((pagina) => pagina.dados) ?? []

  return (
    <LayoutMovel titulo="Histórico" comRegistrar>
      <Chips rotulo="Filtrar por tipo" opcoes={TIPOS} valor={tipo} aoMudar={setTipo} />

      {consulta.isError ? (
        <p className="movel-erro" role="alert">
          {consulta.error.mensagem}
        </p>
      ) : consulta.isPending ? (
        <p className="movel-carregando">Carregando…</p>
      ) : movimentacoes.length === 0 ? (
        <div className="movel-vazio">
          <strong>Nada por aqui ainda</strong>
          As entradas e saídas aparecem aqui assim que forem registradas.
        </div>
      ) : (
        agruparPorDia(movimentacoes, agora).map((dia) => (
          <section key={dia.rotulo} className="movel-dia" aria-label={dia.rotulo}>
            <h2 className="movel-dia-rotulo">{dia.rotulo}</h2>
            <ul className="movel-lista">
              {dia.itens.map((movimentacao) => (
                <li key={movimentacao.id}>
                  <LinhaMovimentacao movimentacao={movimentacao} comProduto agora={agora} />
                </li>
              ))}
            </ul>
          </section>
        ))
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
