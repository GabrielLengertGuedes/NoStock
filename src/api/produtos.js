import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

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
  const habilitado = id != null && String(id).length > 0

  return useQuery({
    queryKey: [...CHAVE, 'detalhe', String(id)],
    enabled: habilitado,
    queryFn: async () => (await api.get(`/produtos/${id}`)).dados,
  })
}

export function useValorInventario() {
  return useQuery({
    queryKey: [...CHAVE, 'inventario-total'],
    queryFn: async () => {
      let pagina = 1
      let totalPaginas = 1
      let valor = 0
      let total = 0

      while (pagina <= totalPaginas && pagina <= 50) {
        const resposta = await api.get('/produtos', { params: { pagina, porPagina: 100 } })
        for (const produto of resposta.dados ?? []) {
          valor += (Number(produto.quantidadeAtual) || 0) * (Number(produto.precoVenda) || 0)
        }
        total = resposta.meta?.total ?? 0
        totalPaginas = resposta.meta?.totalPaginas ?? 1
        pagina += 1
      }

      return { valor, total, completo: pagina > totalPaginas }
    },
  })
}

function useAoConcluir() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: CHAVE })
}

export function useCriarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async (dados) => (await api.post('/produtos', dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useAtualizarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => (await api.put(`/produtos/${id}`, dados)).dados,
    onSuccess: aoConcluir,
  })
}

export function useInativarProduto() {
  const aoConcluir = useAoConcluir()
  return useMutation({
    mutationFn: (id) => api.delete(`/produtos/${id}`),
    onSuccess: aoConcluir,
  })
}
