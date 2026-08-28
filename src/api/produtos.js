import { useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export function useProdutos(filtros) {
  return useQuery({
    queryKey: ['produtos', filtros],
    queryFn: () => api.get('/produtos', { params: filtros }),
  })
}
