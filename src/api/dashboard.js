import { useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['dashboard']

export function useDashboard() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get('/dashboard')).dados,
  })
}
