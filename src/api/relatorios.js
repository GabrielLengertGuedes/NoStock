import { useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['relatorios']

// de/ate so chegam prontos (ISO) quando o periodo esta completo — sem os dois,
// a consulta fica desabilitada em vez de bater na API com filtro pela metade.
function periodoCompleto(de, ate) {
  return Boolean(de && ate)
}

export function useResumoRelatorio({ de, ate }) {
  return useQuery({
    queryKey: [...CHAVE, 'resumo', de, ate],
    enabled: periodoCompleto(de, ate),
    queryFn: async () => (await api.get('/relatorios/resumo', { params: { de, ate } })).dados,
  })
}

// agrupar=categoria e o unico valor que a API aceita (F3-02/F3-03): a visão
// "lista geral" é obtida no cliente, achatando esse mesmo resultado.
export function useRankingRelatorio({ de, ate }) {
  return useQuery({
    queryKey: [...CHAVE, 'ranking', de, ate],
    enabled: periodoCompleto(de, ate),
    queryFn: async () =>
      (await api.get('/relatorios/ranking', { params: { de, ate, agrupar: 'categoria' } })).dados,
  })
}

export function useGiroRelatorio({ de, ate }) {
  return useQuery({
    queryKey: [...CHAVE, 'giro', de, ate],
    enabled: periodoCompleto(de, ate),
    queryFn: async () => (await api.get('/relatorios/giro', { params: { de, ate } })).dados,
  })
}

// Fotografia do estoque atual: nao depende do periodo selecionado.
export function useCategoriasRelatorio() {
  return useQuery({
    queryKey: [...CHAVE, 'categorias'],
    queryFn: async () => (await api.get('/relatorios/categorias')).dados,
  })
}
