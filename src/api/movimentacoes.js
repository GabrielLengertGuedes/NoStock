import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { api } from './client.js'
import { CHAVE as CHAVE_PRODUTOS } from './produtos.js'

export const CHAVE = ['movimentacoes']

// Mesma razao de useProdutos: o historico atual fica na tela ate o novo chegar.
export function useMovimentacoes(filtros) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/movimentacoes', { params: filtros }),
    placeholderData: keepPreviousData,
  })
}

/** Histórico que cresce com "carregar mais", para a rolagem do celular. */
export function useMovimentacoesEmRolagem(filtros) {
  return useInfiniteQuery({
    queryKey: [...CHAVE, 'rolagem', filtros],
    queryFn: ({ pageParam }) =>
      api.get('/movimentacoes', { params: { ...filtros, pagina: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.pagina < meta.totalPaginas ? meta.pagina + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}

export function useRegistrarMovimentacao() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: async (dados) => (await api.post('/movimentacoes', dados)).dados,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CHAVE_PRODUTOS })
      cliente.invalidateQueries({ queryKey: CHAVE })
    },
  })
}
