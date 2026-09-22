import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Reposicao } from '../../src/pages/Reposicao.jsx'

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    temPapel: () => true,
    usuario: { nome: 'Mariana Silva', papel: 'GESTOR' },
    logout: vi.fn(),
  }),
}))

vi.mock('../../src/api/fornecedores.js', () => ({
  useFornecedores: () => ({
    data: [{ id: 3, nome: 'Distribuidora Pet Sul' }],
    isPending: false,
    isError: false,
  }),
}))

vi.mock('../../src/api/reposicao.js', () => ({
  useReposicao: () => ({
    data: {
      grupos: [
        {
          fornecedor: {
            id: 3,
            nome: 'Distribuidora Pet Sul',
            contatoNome: 'Carlos',
            telefone: '47999998888',
            email: 'vendas@petsul.com.br',
          },
          itens: [
            {
              produtoId: 12,
              nome: 'Ração Premium Cães Adultos 15kg',
              quantidadeAtual: 4,
              estoqueMinimo: 10,
              statusEstoque: 'CRITICO',
              quantidadeSugerida: 16,
            },
          ],
          totalItens: 1,
        },
        {
          fornecedor: null,
          itens: [
            {
              produtoId: 20,
              nome: 'Brinquedo Mordedor',
              quantidadeAtual: 0,
              estoqueMinimo: 5,
              statusEstoque: 'SEM_ESTOQUE',
              quantidadeSugerida: 10,
            },
          ],
          totalItens: 1,
        },
      ],
      totalItens: 2,
    },
    isPending: false,
    isError: false,
  }),
}))

function renderizar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: cliente },
      createElement(MemoryRouter, { initialEntries: ['/reposicao'] }, createElement(Reposicao)),
    ),
  )
}

describe('Reposicao', () => {
  it('agrupa os itens por fornecedor, com nome e contato no cabeçalho do grupo', () => {
    const html = renderizar()

    expect(html).toContain('Distribuidora Pet Sul')
    expect(html).toContain('Carlos')
    expect(html).toContain('47999998888')
    expect(html).toContain('vendas@petsul.com.br')
    expect(html).toContain('Ração Premium Cães Adultos 15kg')
    expect(html).toContain('16 un.')
  })

  it('mostra o grupo "Sem fornecedor definido" por último', () => {
    const html = renderizar()

    const indiceComFornecedor = html.indexOf('Distribuidora Pet Sul')
    const indiceSemFornecedor = html.indexOf('Sem fornecedor definido')

    expect(indiceSemFornecedor).toBeGreaterThan(indiceComFornecedor)
    expect(html).toContain('Brinquedo Mordedor')
  })

  it('oferece o botão de impressão e os filtros de status e fornecedor', () => {
    const html = renderizar()

    expect(html).toContain('Imprimir / Exportar')
    expect(html).toContain('Sem estoque')
    expect(html).toContain('Críticos')
    expect(html).toContain('reposicao-fornecedor')
  })
})
