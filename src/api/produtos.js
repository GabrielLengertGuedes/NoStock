import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client.js'

export const CHAVE = ['produtos']

export function useProdutos(filtros) {
  return useQuery({
    queryKey: [...CHAVE, filtros],
    queryFn: () => api.get('/produtos', { params: filtros }),
  })
}

/** Carrega um produto pela listagem (não há GET /produtos/:id no contrato atual). */
export function useProduto(id) {
  const habilitado = id != null && String(id).length > 0

  return useQuery({
    queryKey: [...CHAVE, 'detalhe', id],
    enabled: habilitado,
    queryFn: async () => {
      const alvo = Number(id)
      let pagina = 1
      let totalPaginas = 1

      while (pagina <= totalPaginas) {
        const resposta = await api.get('/produtos', {
          params: { pagina, porPagina: 100, ativo: 'todos' },
        })
        const produto = (resposta.dados ?? []).find((item) => item.id === alvo)
        if (produto) return produto
        totalPaginas = resposta.meta?.totalPaginas ?? 1
        pagina += 1
        if (pagina > 20) break
      }

      const erro = new Error('Produto não encontrado.')
      erro.mensagem = 'Produto não encontrado.'
      throw erro
    },
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
