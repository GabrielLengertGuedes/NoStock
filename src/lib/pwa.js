// O service worker fica em /sw.js porque o escopo dele é a pasta onde mora:
// na raiz, ele recebe os alertas e abre qualquer tela do sistema.
export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((erro) => {
      console.error('Service worker não registrado:', erro)
    })
  })
}

export function suportaPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// iPad com iPadOS se apresenta como Mac; o toque é o que denuncia.
export function ehIOS() {
  if (typeof navigator === 'undefined') return false
  const { userAgent, platform, maxTouchPoints } = navigator
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

/** Aberto pelo ícone da tela de início, e não por uma aba do navegador. */
export function abertoComoApp() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
}

// A chave VAPID vem em base64url; o pushManager.subscribe precisa dos bytes.
export function chaveParaBytes(base64url) {
  const preenchimento = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + preenchimento).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0))
}
