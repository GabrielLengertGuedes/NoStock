// Itens inativos (categoria, fornecedor) com o botao de trazer de volta.
// Some quando nao ha nenhum, para nao ocupar a tela de quem nunca inativou nada.
export function ListaDeInativos({ titulo, descricao, itens, aoReativar, reativando = false }) {
  if (itens.length === 0) return null

  return (
    <section className="painel" aria-label={titulo}>
      <div className="painel-cabecalho">
        <div>
          <h2 className="text-h3">{titulo}</h2>
          {descricao ? (
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              {descricao}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="inativos-lista">
        {itens.map((item) => (
          <li key={item.id}>
            <span>{item.nome}</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => aoReativar(item)}
              disabled={reativando}
            >
              Reativar
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
