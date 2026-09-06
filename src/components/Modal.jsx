import { useEffect, useId, useRef } from 'react'

/**
 * Modal do sistema. Só entra no DOM quando `aberto` é true — evita dialogs
 * “fantasma” na página. Com `showModal()`, o navegador prende o foco e o CSS
 * centraliza na viewport.
 */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  subtitulo,
  children,
  acoes,
  tamanho = 'md',
}) {
  const referencia = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    if (!aberto) return undefined

    const dialogo = referencia.current
    if (!dialogo) return undefined

    if (!dialogo.open) {
      dialogo.showModal()
    }

    return () => {
      if (dialogo.open) {
        dialogo.close()
      }
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <dialog
      ref={referencia}
      className={`modal modal-${tamanho}`}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
    >
      <div className="modal-cabecalho">
        <div className="modal-cabecalho-texto">
          <h2 id={tituloId} className="modal-titulo text-h3">
            {titulo}
          </h2>
          {subtitulo ? <p className="modal-subtitulo">{subtitulo}</p> : null}
        </div>
        <button type="button" className="modal-fechar" onClick={aoFechar} aria-label="Fechar">
          ×
        </button>
      </div>

      <div className="modal-corpo">{children}</div>

      {acoes ? <div className="modal-acoes">{acoes}</div> : null}
    </dialog>
  )
}
