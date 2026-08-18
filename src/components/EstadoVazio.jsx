export function EstadoVazio({ titulo, descricao, acao }) {
  return (
    <div className="estado-vazio">
      <p className="text-h3">{titulo}</p>
      {descricao && (
        <p className="text-body" style={{ color: 'var(--slate)' }}>
          {descricao}
        </p>
      )}
      {acao}
    </div>
  )
}
