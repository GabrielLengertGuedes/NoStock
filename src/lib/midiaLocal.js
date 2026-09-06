const PREFIXO = 'nostock-midia-'

function chave(id) {
  return `${PREFIXO}${id ?? 'novo'}`
}

export function lerMidiaLocal(id) {
  try {
    return sessionStorage.getItem(chave(id))
  } catch {
    return null
  }
}

export function gravarMidiaLocal(id, dataUrl) {
  try {
    sessionStorage.setItem(chave(id), dataUrl)
  } catch {
    /* storage bloqueado */
  }
}

export function apagarMidiaLocal(id) {
  try {
    sessionStorage.removeItem(chave(id))
  } catch {
    /* ignore */
  }
}

export function promoverMidiaNovo(id) {
  const dataUrl = lerMidiaLocal('novo')
  if (!dataUrl || id == null) return
  gravarMidiaLocal(id, dataUrl)
  apagarMidiaLocal('novo')
}
