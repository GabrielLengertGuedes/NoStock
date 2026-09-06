export function KpiCard({ rotulo, valor, meta, tom = 'neutro', Icone, valorPequeno = false, barra }) {
  const preenchimento = Number.isFinite(Number(barra)) ? Math.max(0, Math.min(100, Number(barra))) : null

  return (
    <article className={`kpi-card kpi-card-${tom}`}>
      <div className="kpi-card-topo">
        {Icone ? (
          <span className="kpi-icone" aria-hidden="true">
            <Icone size={18} />
          </span>
        ) : null}
        <p className="text-micro kpi-rotulo">{rotulo}</p>
      </div>
      <p className={`kpi-valor${valorPequeno ? ' kpi-valor-sm' : ''} text-mono`}>{valor}</p>
      {preenchimento != null ? (
        <div className="kpi-barra" aria-hidden="true">
          <span style={{ width: `${preenchimento}%` }} />
        </div>
      ) : null}
      {meta != null && meta !== '' ? <div className="kpi-meta">{meta}</div> : null}
    </article>
  )
}
