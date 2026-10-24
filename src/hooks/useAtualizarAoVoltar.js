import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

// Quem reabre o app ou volta de outro app espera ver o saldo de agora. Só
// busca de novo o que passou dos 30 s de cache: trocar de app e voltar logo
// não gera requisição.
export function useAtualizarAoVoltar() {
  const cliente = useQueryClient()

  useEffect(() => {
    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible') cliente.refetchQueries({ stale: true, type: 'active' })
    }

    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade)
  }, [cliente])
}
