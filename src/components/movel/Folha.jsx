import { useEffect, useId, useRef } from 'react'

import { IconeFechar } from '../IconesBioma.jsx'

/**
 * Folha que sobe de baixo, o modal do celular. É um <dialog> com showModal(),
 * como o Modal do computador: o navegador prende o foco e o Esc fecha.
 * Tocar no fundo escurecido também fecha.
 */
export function Folha({ titulo, aoFechar, children }) {
  const referencia = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => {
      if (dialogo?.open) dialogo.close()
    }
  }, [])

  return (
    <dialog
      ref={referencia}
      className="movel-folha"
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
      onClick={(evento) => {
        // O <dialog> não tem padding: clique nele mesmo só pode ter sido no fundo.
        if (evento.target === evento.currentTarget) aoFechar()
      }}
    >
      <div className="movel-folha-dentro">
        <div className="movel-folha-alca" aria-hidden="true" />
        <div className="movel-folha-topo">
          <h2 id={tituloId} className="movel-folha-titulo">
            {titulo}
          </h2>
          <button type="button" className="movel-fechar" onClick={aoFechar} aria-label="Fechar">
            <IconeFechar size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
