import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'
import { CHAVE as CHAVE_PRODUTOS } from './produtos.js'

export const CHAVE = ['movimentacoes']

export function useMovimentacoes(filtros) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/movimentacoes', { params: filtros }),
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
