import { useEffect, useId, useRef, useState } from 'react'

/**
 * Menu "⋯" no estilo Figma — ações secundárias na tabela.
 * @param {{ rotulo?: string, itens: Array<{ rotulo: string, onClick: () => void, perigo?: boolean, desabilitado?: boolean }> }} props
 */
export function MenuAcoes({ rotulo = 'Ações', itens = [] }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!aberto) return undefined

    function fecharFora(evento) {
      if (raiz.current && !raiz.current.contains(evento.target)) setAberto(false)
    }
    function fecharEsc(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', fecharFora)
    document.addEventListener('keydown', fecharEsc)
    return () => {
      document.removeEventListener('mousedown', fecharFora)
      document.removeEventListener('keydown', fecharEsc)
    }
  }, [aberto])

  return (
    <div className="menu-acoes" ref={raiz}>
      <button
        type="button"
        className="menu-acoes-botao"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={id}
        aria-label={rotulo}
        onClick={() => setAberto((v) => !v)}
      >
        ⋯
      </button>
      <ul id={id} className="menu-acoes-lista" role="menu" hidden={!aberto}>
        {itens.map((item) => (
          <li key={item.rotulo} role="none">
            <button
              type="button"
              role="menuitem"
              className={`menu-acoes-item${item.perigo ? ' menu-acoes-item-perigo' : ''}`}
              disabled={item.desabilitado}
              tabIndex={aberto ? 0 : -1}
              onClick={() => {
                setAberto(false)
                item.onClick()
              }}
            >
              {item.rotulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
