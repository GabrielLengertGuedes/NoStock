import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Dashboard } from '../../src/pages/Dashboard.jsx'

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    temPapel: () => true,
    usuario: { nome: 'Mariana Silva', papel: 'GESTOR' },
    logout: vi.fn(),
  }),
}))

const PRODUTO_EM_ATENCAO = {
  id: 1,
  nome: 'Ração Premium',
  categoria: { id: 1, nome: 'Ração' },
  quantidadeAtual: 2,
  estoqueMinimo: 5,
  statusEstoque: 'CRITICO',
  precoVenda: 40,
}

vi.mock('../../src/api/dashboard.js', () => ({
  useDashboard: () => ({
    data: {
      cards: { totalItens: 3, estoqueBaixo: 1, semEstoque: 0, entradasHoje: 2 },
      produtosAtencao: [PRODUTO_EM_ATENCAO],
    },
    isLoading: false,
    isPending: false,
  }),
}))

vi.mock('../../src/api/produtos.js', () => ({
  useProdutos: () => ({
    data: {
      dados: [PRODUTO_EM_ATENCAO],
      meta: { pagina: 1, totalPaginas: 1, total: 3 },
    },
    isLoading: false,
    isPending: false,
  }),
}))

vi.mock('../../src/api/movimentacoes.js', () => ({
  useMovimentacoes: () => ({
    data: { dados: [], meta: { pagina: 1, totalPaginas: 1, total: 0 } },
    isLoading: false,
    isPending: false,
  }),
}))

describe('Dashboard', () => {
  it('monta os 4 cards, a fila de atenção priorizada e os atalhos de entrada e saída', () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: cliente },
        createElement(MemoryRouter, { initialEntries: ['/dashboard'] }, createElement(Dashboard)),
      ),
    )

    // Os 4 cards do GET /dashboard.
    expect(html).toContain('Total de itens')
    expect(html).toContain('Estoque baixo')
    expect(html).toContain('Sem estoque')
    expect(html).toContain('Entradas (hoje)')

    // Tabela de produtos em atenção, na ordem que o backend devolveu.
    expect(html).toContain('Produtos em atenção')
    expect(html).toContain('Ração Premium')

    // Atalhos de entrada/saída por produto e o botão flutuante de entrada rápida.
    expect(html).toContain('Registrar entrada')
    expect(html).toContain('Registrar saída')

    expect(html).toContain('Última reposição')
    expect(html).toContain('Controle de inventário')
    expect(html).toContain('Resumo dos produtos cadastrados')
    expect(html).toContain('Ver todos')
    expect(html).toContain('Dashboard')
  })
})
