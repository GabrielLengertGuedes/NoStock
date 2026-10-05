import { useEffect, useId, useRef, useState } from 'react'

// Altura de um item e o respiro da lista (padding + borda), em px — usados
// para decidir se o menu cabe abaixo do botão antes de ele existir na tela.
const ALTURA_ITEM = 40
const RESPIRO_LISTA = 14
const DISTANCIA_BOTAO = 4

/**
 * Menu "⋯" no estilo Figma — ações secundárias na tabela.
 * A lista é `position: fixed`, ancorada no botão: dentro de `.tabela-rolagem`
 * (overflow-x: auto) um `absolute` seria cortado pela própria tabela.
 * @param {{ rotulo?: string, itens: Array<{ rotulo: string, onClick: () => void, perigo?: boolean, desabilitado?: boolean }> }} props
 */
export function MenuAcoes({ rotulo = 'Ações', itens = [] }) {
  const [posicao, setPosicao] = useState(null)
  const aberto = posicao !== null
  const raiz = useRef(null)
  const botao = useRef(null)
  const id = useId()

  function fechar() {
    setPosicao(null)
  }

  function alternar() {
    if (aberto) {
      fechar()
      return
    }
    const caixa = botao.current.getBoundingClientRect()
    const alturaLista = itens.length * ALTURA_ITEM + RESPIRO_LISTA
    const cabeAbaixo = caixa.bottom + DISTANCIA_BOTAO + alturaLista <= window.innerHeight
    const abrirAcima = !cabeAbaixo && caixa.top - DISTANCIA_BOTAO - alturaLista >= 0

    setPosicao({
      right: window.innerWidth - caixa.right,
      ...(abrirAcima
        ? { bottom: window.innerHeight - caixa.top + DISTANCIA_BOTAO }
        : { top: caixa.bottom + DISTANCIA_BOTAO }),
    })
  }

  useEffect(() => {
    if (!aberto) return undefined

    function fecharMenu() {
      setPosicao(null)
    }
    function fecharFora(evento) {
      if (raiz.current && !raiz.current.contains(evento.target)) fecharMenu()
    }
    function fecharEsc(evento) {
      if (evento.key === 'Escape') fecharMenu()
    }

    // Fixo na viewport: se a página ou a tabela rolar, o menu se descolaria do botão.
    document.addEventListener('mousedown', fecharFora)
    document.addEventListener('keydown', fecharEsc)
    window.addEventListener('scroll', fecharMenu, true)
    window.addEventListener('resize', fecharMenu)
    return () => {
      document.removeEventListener('mousedown', fecharFora)
      document.removeEventListener('keydown', fecharEsc)
      window.removeEventListener('scroll', fecharMenu, true)
      window.removeEventListener('resize', fecharMenu)
    }
  }, [aberto])

  return (
    <div className="menu-acoes" ref={raiz}>
      <button
        ref={botao}
        type="button"
        className="menu-acoes-botao"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={id}
        aria-label={rotulo}
        onClick={alternar}
      >
        ⋯
      </button>
      <ul id={id} className="menu-acoes-lista" role="menu" hidden={!aberto} style={posicao ?? undefined}>
        {itens.map((item) => (
          <li key={item.rotulo} role="none">
            <button
              type="button"
              role="menuitem"
              className={`menu-acoes-item${item.perigo ? ' menu-acoes-item-perigo' : ''}`}
              disabled={item.desabilitado}
              tabIndex={aberto ? 0 : -1}
              onClick={() => {
                fechar()
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
