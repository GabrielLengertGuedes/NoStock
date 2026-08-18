export function Campo({ id, rotulo, erro, obrigatorio = false, ajuda, children, ...resto }) {
  const idAjuda = ajuda ? `${id}-ajuda` : undefined
  const idErro = erro ? `${id}-erro` : undefined

  return (
    <div className="campo">
      <label className="input-label" htmlFor={id}>
        {rotulo}
        {obrigatorio && <span aria-hidden="true"> *</span>}
      </label>

      {children ?? (
        <input
          id={id}
          className="input-field"
          aria-invalid={erro ? 'true' : undefined}
          aria-describedby={[idAjuda, idErro].filter(Boolean).join(' ') || undefined}
          aria-required={obrigatorio || undefined}
          {...resto}
        />
      )}

      {ajuda && (
        <p id={idAjuda} className="text-caption" style={{ color: 'var(--gray)' }}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="campo-erro text-body-sm" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
