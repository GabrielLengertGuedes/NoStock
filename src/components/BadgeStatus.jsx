const ESTADOS = {
  NORMAL: { rotulo: 'OK', classe: 'badge-status-normal' },
  BAIXO: { rotulo: 'ATENÇÃO', classe: 'badge-status-baixo' },
  CRITICO: { rotulo: 'CRÍTICO', classe: 'badge-status-critico' },
  SEM_ESTOQUE: { rotulo: 'SEM ESTOQUE', classe: 'badge-status-sem-estoque' },
}

export function BadgeStatus({ status }) {
  const estado = ESTADOS[status]

  if (!estado) {
    return <span className="badge badge-info">{status ?? '—'}</span>
  }

  return <span className={`badge-status ${estado.classe}`}>{estado.rotulo}</span>
}
