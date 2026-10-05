import { MutationCache, QueryClient } from '@tanstack/react-query'

import { CHAVE as CHAVE_DASHBOARD } from './dashboard.js'

export const queryClient = new QueryClient({
  // Toda escrita (movimentação, produto, categoria) mexe nos cards do
  // dashboard e no sino de alertas: sem isso eles ficavam com o número antigo.
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_DASHBOARD }),
  }),
  defaultOptions: {
    queries: {
      // Repetir erro de permissao ou de validacao so atrasa a resposta na tela.
      retry: (tentativas, erro) => erro?.status >= 500 && tentativas < 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
