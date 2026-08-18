import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Repetir erro de permissao ou de validacao so atrasa a resposta na tela.
      retry: (tentativas, erro) => erro?.status >= 500 && tentativas < 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
