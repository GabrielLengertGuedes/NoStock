import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['fornecedores']

// Por padrao so os ativos: e o que os selects de produto podem oferecer.
export function useFornecedores({ incluirInativos = false } = {}) {
  return useQuery({
    queryKey: [...CHAVE, { incluirInativos }],
    queryFn: async () =>
      (await api.get('/fornecedores', { params: incluirInativos ? { incluirInativos: 'true' } : {} })).dados,
  })
}

// Invalidacao do cache depois de cada escrita: ver queryClient.js.
export function useCriarFornecedor() {
  return useMutation({
    mutationFn: async (dados) => (await api.post('/fornecedores', dados)).dados,
  })
}

export function useAtualizarFornecedor() {
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/fornecedores/${id}`, dados)).dados,
  })
}

export function useInativarFornecedor() {
  return useMutation({
    mutationFn: (id) => api.delete(`/fornecedores/${id}`),
  })
}

export function useReativarFornecedor() {
  return useMutation({
    mutationFn: (id) => api.post(`/fornecedores/${id}/reativar`),
  })
}
