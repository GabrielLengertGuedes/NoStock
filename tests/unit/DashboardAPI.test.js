import { describe, expect, it, vi } from 'vitest'

const dashboardRepository = {
  listarResumo: vi.fn(async () => ({
    totalItens: 7,
    totalBaixo: 2,
    totalZerado: 1,
    totalEntradasHoje: 3,
    produtosAtencao: [
      { id: 1, nome: 'Produto 1', statusEstoque: 'BAIXO', quantidadeAtual: 3, estoqueMinimo: 8, precoVenda: 10 },
      { id: 2, nome: 'Produto 2', statusEstoque: 'SEM_ESTOQUE', quantidadeAtual: 0, estoqueMinimo: 4, precoVenda: 10 },
      { id: 3, nome: 'Produto 3', statusEstoque: 'CRITICO', quantidadeAtual: 2, estoqueMinimo: 5, precoVenda: 10 },
    ],
  })),
}

vi.mock('../../server/modules/dashboard/repository.js', () => ({
  listarResumo: dashboardRepository.listarResumo,
}))

import { obterDashboard } from '../../server/modules/dashboard/service.js'

describe('dashboard service', () => {
  it('retorna 4 cards e ordena produtosAtencao por prioridade de estoque no fuso da loja', async () => {
    const resposta = await obterDashboard()

    expect(resposta.dados.cards).toHaveLength(4)
    expect(resposta.dados.produtosAtencao.map((produto) => produto.id)).toEqual([2, 3, 1])
    expect(resposta.dados.dia).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
