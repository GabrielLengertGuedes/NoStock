import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['produtos']

export function useProdutos(filtros) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/produtos', { params: filtros }),
  })
}

function useAoConcluir() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: CHAVE })
}

export function useCriarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async (dados) => (await api.post('/produtos', dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useAtualizarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/produtos/${id}`, dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useInativarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.delete(`/produtos/${id}`),
    onSuccess: aoConcluir,
  })
}
