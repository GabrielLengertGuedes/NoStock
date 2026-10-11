/** Filtro de uma escolha só, em pílulas que rolam de lado quando não cabem. */
export function Chips({ rotulo, opcoes, valor, aoMudar }) {
  return (
    <div className="movel-chips" role="group" aria-label={rotulo}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor || 'todos'}
          type="button"
          className="movel-chip"
          aria-pressed={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
        >
          {opcao.rotulo}
          {opcao.contagem != null ? <small>{opcao.contagem}</small> : null}
        </button>
      ))}
    </div>
  )
}
