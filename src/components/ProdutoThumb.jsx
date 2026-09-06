import { IconeCategoria } from './IconesBioma.jsx'
import { lerMidiaLocal } from '../lib/midiaLocal.js'

const PALETAS = ['thumb-mint', 'thumb-lime', 'thumb-peach', 'thumb-sand', 'thumb-rose']

function hashTexto(texto = '') {
  let hash = 0
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0
  }
  return hash
}

function srcDoThumb(id, foto) {
  if (foto) return foto
  return id != null ? lerMidiaLocal(id) : null
}

/** Thumb: foto local se existir, senão ícone por categoria. */
export function ProdutoThumb({ id, nome = '', categoria = '', foto }) {
  const src = srcDoThumb(id, foto)
  const chave = (categoria || nome || '?').trim()
  const classe = PALETAS[hashTexto(chave) % PALETAS.length]

  if (src) {
    return (
      <span className={`produto-thumb produto-thumb-foto ${classe}`} aria-hidden="true" title={categoria || undefined}>
        <img src={src} alt="" />
      </span>
    )
  }

  return (
    <span className={`produto-thumb ${classe}`} aria-hidden="true" title={categoria || undefined}>
      <IconeCategoria categoria={categoria || nome} size={18} />
    </span>
  )
}
