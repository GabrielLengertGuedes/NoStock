const PALETAS = ['thumb-mint', 'thumb-lime', 'thumb-peach', 'thumb-sand', 'thumb-rose']

function hashTexto(texto = '') {
  let hash = 0
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0
  }
  return hash
}

export function AvatarIniciais({ nome = '', tamanho = 'md' }) {
  const inicial = nome.trim().charAt(0).toUpperCase() || '?'
  const classe = PALETAS[hashTexto(nome) % PALETAS.length]
  return (
    <span className={`avatar-iniciais avatar-iniciais-${tamanho} ${classe}`} aria-hidden="true">
      {inicial}
    </span>
  )
}
