import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['movimentacoes']

// Mesma razao de useProdutos: o historico atual fica na tela ate o novo chegar.
export function useMovimentacoes(filtros) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/movimentacoes', { params: filtros }),
    placeholderData: keepPreviousData,
  })
}

// Invalidacao do cache depois de cada escrita: ver queryClient.js.
export function useRegistrarMovimentacao() {
  return useMutation({
    mutationFn: async (dados) => (await api.post('/movimentacoes', dados)).dados,
  })
}
