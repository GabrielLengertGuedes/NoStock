import { useEffect, useId, useRef } from 'react'

/**
 * Modal do sistema. Só entra no DOM quando `aberto` é true — evita dialogs
 * “fantasma” na página. Com `showModal()`, o navegador prende o foco e o CSS
 * centraliza na viewport.
 *
 * `bloquearFechamento` segura o × e o ESC enquanto um envio está em curso:
 * fechar no meio fazia a pessoa não ver o resultado e registrar de novo.
 */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  subtitulo,
  children,
  acoes,
  tamanho = 'md',
  bloquearFechamento = false,
}) {
  const referencia = useRef(null)
  const fechandoPeloReact = useRef(false)
  const tituloId = useId()

  useEffect(() => {
    if (!aberto) return undefined

    const dialogo = referencia.current
    if (!dialogo) return undefined

    fechandoPeloReact.current = false
    if (!dialogo.open) {
      dialogo.showModal()
    }

    return () => {
      fechandoPeloReact.current = true
      if (dialogo.open) {
        dialogo.close()
      }
    }
  }, [aberto])

  // O Chrome deixa um segundo ESC seguido fechar o dialog mesmo com o cancel
  // barrado. Sem isto o React seguia achando o modal aberto, e ele ficava
  // montado e invisivel: bloqueado, reabre; senao, fecha de verdade.
  function aoFecharPeloNavegador() {
    if (fechandoPeloReact.current) return
    const dialogo = referencia.current
    if (bloquearFechamento) {
      if (dialogo?.isConnected && !dialogo.open) dialogo.showModal()
    } else {
      aoFechar()
    }
  }

  if (!aberto) return null

  return (
    <dialog
      ref={referencia}
      className={`modal modal-${tamanho}`}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault()
        if (!bloquearFechamento) aoFechar()
      }}
      onClose={aoFecharPeloNavegador}
    >
      <div className="modal-cabecalho">
        <div className="modal-cabecalho-texto">
          <h2 id={tituloId} className="modal-titulo text-h3">
            {titulo}
          </h2>
          {subtitulo ? <p className="modal-subtitulo">{subtitulo}</p> : null}
        </div>
        <button
          type="button"
          className="modal-fechar"
          onClick={aoFechar}
          disabled={bloquearFechamento}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="modal-corpo">{children}</div>

      {acoes ? <div className="modal-acoes">{acoes}</div> : null}
    </dialog>
  )
}
