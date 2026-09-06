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

vi.mock('../../src/api/produtos.js', () => ({
  useProdutos: () => ({
    data: {
      dados: [
        {
          id: 1,
          nome: 'Ração Premium',
          categoria: { id: 1, nome: 'Ração' },
          quantidadeAtual: 2,
          estoqueMinimo: 5,
          statusEstoque: 'CRITICO',
          precoVenda: 40,
        },
      ],
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
  it('oferece atalhos de entrada e saída', () => {
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

    expect(html).toContain('Total de itens')
    expect(html).toContain('Entradas (hoje)')
    expect(html).toContain('Última reposição')
    expect(html).toContain('Controle de inventário')
    expect(html).toContain('Resumo dos produtos cadastrados')
    expect(html).toContain('Ver todos')
    expect(html).toContain('Dashboard')
  })
})
