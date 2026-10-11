import { useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['notificacoes']

/** Chave pública VAPID do servidor; null quando o push não está configurado. */
export function useChavePublica({ enabled = true } = {}) {
  return useQuery({
    queryKey: [...CHAVE, 'chave-publica'],
    queryFn: async () => (await api.get('/notificacoes/chave-publica')).dados.chavePublica,
    staleTime: Infinity,
    enabled,
  })
}

/** Aparelhos do usuário logado inscritos nos alertas. */
export function useInscricoes({ enabled = true } = {}) {
  return useQuery({
    queryKey: [...CHAVE, 'inscricoes'],
    queryFn: async () => (await api.get('/notificacoes/inscricoes')).dados,
    enabled,
  })
}

export function salvarInscricao(assinatura, nivel) {
  const { endpoint, keys } = assinatura.toJSON()
  return api.put('/notificacoes/inscricoes', { endpoint, chaves: keys, nivel })
}

export function removerInscricao(endpoint) {
  return api.delete('/notificacoes/inscricoes', { data: { endpoint } })
}

export function enviarAlertaDeTeste(endpoint) {
  return api.post('/notificacoes/teste', { endpoint })
}
