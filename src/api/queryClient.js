import { MutationCache, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  // Toda escrita invalida todo o cache. Uma movimentacao mexe em produtos,
  // dashboard, sino, reposicao, relatorios e categorias; renomear categoria ou
  // fornecedor aparece em produtos e na reposicao. Listar quem depende de quem
  // deixava sempre alguma tela com o numero antigo. So as consultas montadas
  // buscam de novo na hora; as outras so quando voltarem para a tela.
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries(),
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
