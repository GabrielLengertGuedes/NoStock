import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['categorias']

export function useCategorias() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get('/categorias')).dados,
  })
}

function useAoConcluir() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: CHAVE })
}

export function useCriarCategoria() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async (dados) => (await api.post('/categorias', dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useAtualizarCategoria() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/categorias/${id}`, dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useInativarCategoria() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.delete(`/categorias/${id}`),
    onSuccess: aoConcluir,
  })
}
