import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['categorias']

// Por padrao so as ativas: e o que os selects de produto podem oferecer.
export function useCategorias({ incluirInativas = false } = {}) {
  return useQuery({
    queryKey: [...CHAVE, { incluirInativas }],
    queryFn: async () =>
      (await api.get('/categorias', { params: incluirInativas ? { incluirInativas: 'true' } : {} })).dados,
  })
}

// Invalidacao do cache depois de cada escrita: ver queryClient.js.
export function useCriarCategoria() {
  return useMutation({
    mutationFn: async (dados) => (await api.post('/categorias', dados)).dados,
  })
}

export function useAtualizarCategoria() {
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/categorias/${id}`, dados)).dados,
  })
}

export function useInativarCategoria() {
  return useMutation({
    mutationFn: (id) => api.delete(`/categorias/${id}`),
  })
}

export function useReativarCategoria() {
  return useMutation({
    mutationFn: (id) => api.post(`/categorias/${id}/reativar`),
  })
}
