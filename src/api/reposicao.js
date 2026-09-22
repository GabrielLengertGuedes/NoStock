import { useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['reposicao']

export function useReposicao({ fornecedorId, status } = {}) {
  return useQuery({
    queryKey: [...CHAVE, fornecedorId ?? null, status ?? null],
    queryFn: async () => (await api.get('/reposicao', { params: { fornecedorId, status } })).dados,
  })
}
