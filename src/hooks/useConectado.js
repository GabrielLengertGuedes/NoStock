import { useSyncExternalStore } from 'react'

function assinar(avisar) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

/** Se o aparelho tem conexão agora. Fora do navegador, assume que sim. */
export function useConectado() {
  return useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  )
}
