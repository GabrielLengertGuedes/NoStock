import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Movimentacoes } from '../../src/pages/Movimentacoes.jsx'

let perfilAtual = 'GESTOR'

vi.mock('../../src/api/movimentacoes.js', () => ({
  useMovimentacoes: () => ({
    data: {
      dados: [
        {
          id: 9,
          produto: { id: 1, nome: 'Ração Premium' },
          tipo: 'SAIDA',
          motivo: 'VENDA',
          quantidade: 3,
          saldoAnterior: 7,
          saldoPosterior: 4,
          observacao: null,
          criadoEm: '2026-09-05T14:35:00-03:00',
          usuario: { id: 2, nome: 'Marina Alves' },
        },
        {
          id: 8,
          produto: { id: 1, nome: 'Ração Premium' },
          tipo: 'ENTRADA',
          motivo: 'COMPRA',
          quantidade: 7,
          saldoAnterior: 0,
          saldoPosterior: 7,
          observacao: null,
          criadoEm: '2026-09-04T09:10:00-03:00',
          usuario: { id: 3, nome: 'Carlos Dias' },
        },
      ],
      meta: { pagina: 1, porPagina: 20, total: 2, totalPaginas: 1 },
    },
    isPending: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('../../src/api/produtos.js', () => ({
  useProdutos: () => ({
    data: { dados: [{ id: 1, nome: 'Ração Premium' }], meta: { pagina: 1, totalPaginas: 1, total: 1 } },
    isPending: false,
    isError: false,
  }),
}))

vi.mock('../../src/api/usuarios.js', () => ({
  useUsuarios: () => ({
    data: [
      { id: 2, nome: 'Marina Alves' },
      { id: 3, nome: 'Carlos Dias' },
    ],
    isPending: false,
    isError: false,
  }),
}))

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    usuario: { id: 1, nome: 'Gestor' },
    temPapel: (papel) => perfilAtual === papel,
    logout: () => {},
  }),
}))

function renderizar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: cliente },
      createElement(MemoryRouter, { initialEntries: ['/movimentacoes'] }, createElement(Movimentacoes)),
    ),
  )
}

describe('Movimentacoes', () => {
  it('lista data, hora, tipo, motivo, produto, quantidade e responsável (RF11)', () => {
    perfilAtual = 'GESTOR'
    const html = renderizar()

    for (const coluna of ['Data', 'Hora', 'Tipo', 'Motivo', 'Produto', 'Quantidade', 'Responsável']) {
      expect(html).toContain(`>${coluna}</th>`)
    }

    expect(html).toContain('Ração Premium')
    expect(html).toContain('Saída')
    expect(html).toContain('Venda')
    expect(html).toContain('Entrada')
    expect(html).toContain('Compra')
    // CA11.3: o responsavel aparece pelo nome, nao pelo id.
    expect(html).toContain('Marina Alves')
    expect(html).toContain('Carlos Dias')
  })

  it('não oferece nenhuma ação de editar ou excluir (CA11.4, RN03)', () => {
    perfilAtual = 'GESTOR'
    const html = renderizar()
    const tabela = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? ''

    expect(tabela).not.toContain('Editar')
    expect(tabela).not.toContain('Excluir')
    expect(tabela).not.toContain('<button')
  })

  it('oferece os filtros de período, produto, tipo e funcionário ao gestor (CA11.2)', () => {
    perfilAtual = 'GESTOR'
    const html = renderizar()

    expect(html).toContain('movimentacoes-de')
    expect(html).toContain('movimentacoes-ate')
    expect(html).toContain('movimentacoes-produto')
    expect(html).toContain('movimentacoes-tipo')
    expect(html).toContain('movimentacoes-usuario')
  })

  it('esconde do operador o filtro por funcionário, que depende de GET /usuarios (RN10)', () => {
    perfilAtual = 'OPERADOR'
    const html = renderizar()

    expect(html).toContain('movimentacoes-tipo')
    expect(html).not.toContain('movimentacoes-usuario')
  })
})
