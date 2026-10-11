import { keepPreviousData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['produtos']

// keepPreviousData: ao trocar filtro, busca ou pagina, a lista atual fica na
// tela ate a nova chegar, em vez de piscar vazia a cada consulta.
export function useProdutos(filtros, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/produtos', { params: filtros }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

function proximaPagina({ meta }) {
  return meta.pagina < meta.totalPaginas ? meta.pagina + 1 : undefined
}

/** Lista que cresce com "carregar mais", para a rolagem do celular. */
export function useProdutosEmRolagem(filtros) {
  return useInfiniteQuery({
    queryKey: [...CHAVE, 'rolagem', filtros],
    queryFn: ({ pageParam }) => api.get('/produtos', { params: { ...filtros, pagina: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: proximaPagina,
    placeholderData: keepPreviousData,
  })
}

/** Um produto, ativo ou não, com o contato do fornecedor. */
export function useProduto(id) {
  return useQuery({
    queryKey: [...CHAVE, 'detalhe', id],
    enabled: id != null && String(id).length > 0,
    queryFn: async () => (await api.get(`/produtos/${id}`)).dados,
  })
}

// Total, quantos precisam repor e valor do inventario, somados no servidor.
export function useResumoProdutos() {
  return useQuery({
    queryKey: [...CHAVE, 'resumo'],
    queryFn: async () => (await api.get('/produtos/resumo')).dados,
  })
}

// Invalidacao do cache depois de cada escrita: ver queryClient.js.
export function useCriarProduto() {
  return useMutation({
    mutationFn: async (dados) => (await api.post('/produtos', dados)).dados,
  })
}

export function useAtualizarProduto() {
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/produtos/${id}`, dados)).dados,
  })
}

export function useInativarProduto() {
  return useMutation({
    mutationFn: (id) => api.delete(`/produtos/${id}`),
  })
}

export function useReativarProduto() {
  return useMutation({
    mutationFn: (id) => api.post(`/produtos/${id}/reativar`),
  })
}
