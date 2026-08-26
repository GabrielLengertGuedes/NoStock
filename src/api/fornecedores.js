import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['fornecedores']

export function useFornecedores() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get('/fornecedores')).dados,
  })
}

function useAoConcluir() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: CHAVE })
}

export function useCriarFornecedor() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async (dados) => (await api.post('/fornecedores', dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useAtualizarFornecedor() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/fornecedores/${id}`, dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useInativarFornecedor() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.delete(`/fornecedores/${id}`),
    onSuccess: aoConcluir,
  })
}
