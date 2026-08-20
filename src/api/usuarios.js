import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['usuarios']

export function useUsuarios(ativo = 'true') {
  return useQuery({
    queryKey: [...CHAVE, ativo],
    queryFn: async () => (await api.get('/usuarios', { params: { ativo } })).dados,
  })
}

function useAoConcluir() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: CHAVE })
}

export function useCriarUsuario() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async (dados) => (await api.post('/usuarios', dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useAtualizarUsuario() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/usuarios/${id}`, dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useInativarUsuario() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.delete(`/usuarios/${id}`),
    onSuccess: aoConcluir,
  })
}

export function useReativarUsuario() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.post(`/usuarios/${id}/reativar`),
    onSuccess: aoConcluir,
  })
}

export function useRedefinirSenhaUsuario() {
  return useMutation({
    mutationFn: ({ id, senhaNova }) => api.patch(`/usuarios/${id}/senha`, { senhaNova }),
  })
}
