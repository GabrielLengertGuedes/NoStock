import { useEffect, useRef } from 'react'

// Usa o <dialog> do navegador: foco preso dentro, Esc fecha e fundo inerte
// sem precisar de biblioteca.
export function Modal({ aberto, aoFechar, titulo, children, acoes }) {
  const referencia = useRef(null)

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return

    if (aberto && !dialogo.open) {
      dialogo.showModal()
    } else if (!aberto && dialogo.open) {
      dialogo.close()
    }
  }, [aberto])

  return (
    <dialog ref={referencia} className="modal" onCancel={aoFechar} onClose={aoFechar}>
      <div className="modal-cabecalho">
        <h2 className="text-h3">{titulo}</h2>
        <button type="button" className="modal-fechar" onClick={aoFechar} aria-label="Fechar">
          ×
        </button>
      </div>

      <div className="modal-corpo">{children}</div>

      {acoes && <div className="modal-acoes">{acoes}</div>}
    </dialog>
  )
}
