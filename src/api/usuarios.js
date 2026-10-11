import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['usuarios']

export function useUsuarios(ativo = 'true') {
  return useQuery({
    queryKey: [...CHAVE, ativo],
    queryFn: async () => (await api.get('/usuarios', { params: { ativo } })).dados,
  })
}

// Invalidacao do cache depois de cada escrita: ver queryClient.js.
export function useCriarUsuario() {
  return useMutation({
    mutationFn: async (dados) => (await api.post('/usuarios', dados)).dados,
  })
}

export function useAtualizarUsuario() {
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/usuarios/${id}`, dados)).dados,
  })
}

export function useInativarUsuario() {
  return useMutation({
    mutationFn: (id) => api.delete(`/usuarios/${id}`),
  })
}

export function useReativarUsuario() {
  return useMutation({
    mutationFn: (id) => api.post(`/usuarios/${id}/reativar`),
  })
}

export function useRedefinirSenhaUsuario() {
  return useMutation({
    mutationFn: ({ id, senhaNova }) => api.patch(`/usuarios/${id}/senha`, { senhaNova }),
  })
}
