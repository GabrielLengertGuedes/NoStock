const ESTADOS = {
  NORMAL: { rotulo: 'Normal', classe: 'badge-status-normal' },
  BAIXO: { rotulo: 'Baixo', classe: 'badge-status-baixo' },
  CRITICO: { rotulo: 'Crítico', classe: 'badge-status-critico' },
  SEM_ESTOQUE: { rotulo: 'Sem estoque', classe: 'badge-status-sem-estoque' },
}

// A cor nunca e a unica pista: o rotulo em texto vai junto, e SEM_ESTOQUE tem
// preenchimento solido para se distinguir de CRITICO tambem no formato.
export function BadgeStatus({ status }) {
  const estado = ESTADOS[status]

  if (!estado) {
    return <span className="badge badge-info">{status ?? '—'}</span>
  }

  return <span className={`badge ${estado.classe}`}>{estado.rotulo}</span>
}
