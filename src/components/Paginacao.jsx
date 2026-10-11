import { useEffect, useRef } from 'react'

export function Paginacao({ pagina, totalPaginas, total, aoMudar }) {
  // A pagina atual pode deixar de existir: excluir o ultimo item dela, ou uma
  // movimentacao tirar o produto do filtro. Sem isto a tela ficava numa pagina
  // vazia, dizendo "nenhum produto", e sem paginador para sair dela.
  const foraDoFim = totalPaginas > 0 && pagina > totalPaginas
  // Enquanto a pagina nova nao chega, a anterior continua na tela (placeholder)
  // e ainda esta fora do fim: a correcao vai uma vez so.
  const corrigidaPara = useRef(null)

  useEffect(() => {
    if (!foraDoFim) {
      corrigidaPara.current = null
      return
    }
    if (corrigidaPara.current === totalPaginas) return
    corrigidaPara.current = totalPaginas
    aoMudar(totalPaginas)
  }, [foraDoFim, totalPaginas, aoMudar])

  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => aoMudar(pagina - 1)}
        disabled={pagina <= 1}
      >
        Anterior
      </button>

      <span className="text-body-sm" aria-live="polite">
        Página {pagina} de {totalPaginas}
        {total !== undefined && ` · ${total} ${total === 1 ? 'item' : 'itens'}`}
      </span>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => aoMudar(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Próxima
      </button>
    </nav>
  )
}
