import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Relatorios } from '../../src/pages/Relatorios.jsx'

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    temPapel: () => true,
    usuario: { nome: 'Mariana Silva', papel: 'GESTOR' },
    logout: vi.fn(),
  }),
}))

vi.mock('../../src/api/relatorios.js', () => ({
  useResumoRelatorio: () => ({
    data: { periodo: { de: '2026-08-01', ate: '2026-08-31' }, totalVendido: 3868.6, unidadesVendidas: 64 },
    isPending: false,
    isError: false,
  }),
  useGiroRelatorio: () => ({
    data: {
      formula: 'unidades vendidas no período ÷ saldo médio do período',
      geral: { unidadesVendidas: 64, saldoMedio: 106, giro: 0.6 },
      produtos: [],
    },
    isPending: false,
    isError: false,
  }),
  useRankingRelatorio: () => ({
    data: {
      agrupar: 'categoria',
      categorias: [
        {
          categoria: { id: 1, nome: 'Ração' },
          produtos: [{ id: 2, nome: 'Ração Premium Cães Adultos', unidades: 13, receita: 2468.7 }],
        },
        {
          categoria: { id: 3, nome: 'Brinquedos' },
          produtos: [{ id: 5, nome: 'Bolinha de Borracha', unidades: 35, receita: 696.5 }],
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
  useCategoriasRelatorio: () => ({
    data: {
      categorias: [
        { id: 1, nome: 'Ração', produtos: 2, unidades: 39, valorImobilizado: 7246.1 },
        { id: 3, nome: 'Brinquedos', produtos: 1, unidades: 50, valorImobilizado: 995 },
      ],
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
      createElement(MemoryRouter, { initialEntries: ['/relatorios'] }, createElement(Relatorios)),
    ),
  )
}

describe('Relatorios', () => {
  it('mostra o total vendido, as unidades vendidas e o giro de estoque com a fórmula', () => {
    const html = renderizar()

    expect(html).toContain('Total vendido')
    expect(html).toContain('Unidades vendidas')
    expect(html).toContain('Giro de estoque')
    expect(html).toContain('unidades vendidas no período ÷ saldo médio do período')
  })

  it('mostra o ranking agrupado por categoria por padrão, com a opção de lista geral', () => {
    const html = renderizar()

    expect(html).toContain('Ranking de produtos')
    expect(html).toContain('Agrupado por categoria')
    expect(html).toContain('Lista geral')
    expect(html).toContain('Ração')
    expect(html).toContain('Ração Premium Cães Adultos')
    expect(html).toContain('Brinquedos')
    expect(html).toContain('Bolinha de Borracha')
  })

  it('mostra a distribuição de produtos e valor imobilizado por categoria', () => {
    const html = renderizar()

    expect(html).toContain('Distribuição por categoria')
    expect(html).toContain('Valor imobilizado')
    expect(html).toContain('7.246,10')
  })

  it('oferece os campos de período', () => {
    const html = renderizar()

    expect(html).toContain('relatorios-de')
    expect(html).toContain('relatorios-ate')
  })
})
