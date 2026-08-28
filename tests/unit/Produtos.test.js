import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../src/contexts/AuthProvider.jsx'
import { Produtos } from '../../src/pages/Produtos.jsx'

vi.mock('../../src/api/produtos.js', () => ({
  useProdutos: () => ({
    data: {
      dados: [
        {
          id: 1,
          nome: 'Ração Premium',
          categoria: { id: 1, nome: 'Ração' },
          fornecedor: { id: 2, nome: 'Pet Fornecedores' },
          quantidadeAtual: 4,
          estoqueMinimo: 3,
          statusEstoque: 'BAIXO',
          precoVenda: 42.9,
          descricao: 'Para cães adultos',
          ativo: true,
        },
      ],
      meta: { pagina: 1, totalPaginas: 1, total: 1 },
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useCriarProduto: () => ({ isPending: false, error: null, reset: () => {}, mutateAsync: vi.fn() }),
  useAtualizarProduto: () => ({ isPending: false, error: null, reset: () => {}, mutateAsync: vi.fn() }),
  useInativarProduto: () => ({ isPending: false, error: null, mutateAsync: vi.fn() }),
}))

vi.mock('../../src/api/categorias.js', () => ({
  useCategorias: () => ({ data: [{ id: 1, nome: 'Ração' }], isPending: false, isError: false }),
}))

vi.mock('../../src/api/fornecedores.js', () => ({
  useFornecedores: () => ({ data: [{ id: 2, nome: 'Pet Fornecedores' }], isPending: false, isError: false }),
}))

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({ temPapel: (papel) => papel === 'GESTOR' }),
}))

describe('Produtos', () => {
  it('lista os produtos e oferece cadastro com ações de gestão', () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: cliente },
        createElement(
          MemoryRouter,
          { initialEntries: ['/produtos'] },
          createElement(AuthProvider, null, createElement(Produtos)),
        ),
      ),
    )

    expect(html).toContain('Produtos')
    expect(html).toContain('Novo produto')
    expect(html).toContain('Ração Premium')
    expect(html).toContain('Editar')
    expect(html).toContain('Excluir')
  })
})
