export function Paginacao({ pagina, totalPaginas, total, aoMudar }) {
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
