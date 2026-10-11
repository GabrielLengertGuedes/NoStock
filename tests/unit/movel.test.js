import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LinhaMovimentacao } from '../../src/components/movel/LinhaMovimentacao.jsx'
import { InicioMovel } from '../../src/pages/movel/InicioMovel.jsx'
import { ProdutoMovel } from '../../src/pages/movel/ProdutoMovel.jsx'

const sessao = vi.hoisted(() => ({ papel: 'GESTOR' }))
const produtoAtual = vi.hoisted(() => ({ valor: null }))

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    usuario: { nome: 'Marina Souza', papel: sessao.papel },
    temPapel: (papel) => papel === sessao.papel,
  }),
}))

vi.mock('../../src/hooks/useRegistroMovel.js', () => ({
  useRegistroMovel: () => ({ abrir: vi.fn() }),
}))

vi.mock('../../src/hooks/useToast.js', () => ({
  useToast: () => ({ mostrar: vi.fn() }),
}))

vi.mock('../../src/hooks/useAlertasPush.js', () => ({
  useAlertasPush: () => ({ estado: 'ligado', erro: null, ocupado: false }),
}))

vi.mock('../../src/api/dashboard.js', () => ({
  useDashboard: () => ({
    data: {
      cards: { totalProdutos: 148, estoqueBaixo: 7, semEstoque: 2, entradasHoje: 5, saidasHoje: 12 },
      produtosAtencao: [
        {
          id: 4,
          nome: 'Areia Higiênica 4kg',
          categoria: { id: 2, nome: 'Higiene' },
          quantidadeAtual: 0,
          estoqueMinimo: 8,
          statusEstoque: 'SEM_ESTOQUE',
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
}))

vi.mock('../../src/api/produtos.js', () => ({
  useProduto: () => ({ data: produtoAtual.valor, isPending: false, isError: false }),
}))

vi.mock('../../src/api/movimentacoes.js', () => ({
  useMovimentacoes: () => ({ data: { dados: [] }, isPending: false }),
}))

const GOLDEN = {
  id: 9,
  nome: 'Ração Golden 15kg',
  categoria: { id: 1, nome: 'Ração' },
  fornecedor: { id: 3, nome: 'Litoral Pet', contatoNome: 'Rogério', telefone: '47998124410', email: null },
  quantidadeAtual: 0,
  estoqueMinimo: 6,
  statusEstoque: 'SEM_ESTOQUE',
  ativo: true,
}

function renderizar(caminho, rota, elemento) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: cliente },
      createElement(
        MemoryRouter,
        { initialEntries: [caminho] },
        createElement(Routes, null, createElement(Route, { path: rota, element: createElement(elemento) })),
      ),
    ),
  )
}

beforeEach(() => {
  sessao.papel = 'GESTOR'
  produtoAtual.valor = GOLDEN
})

describe('Início no celular', () => {
  it('soma sem estoque e abaixo do mínimo em "Precisa repor", como o sino', () => {
    const html = renderizar('/m', '/m', InicioMovel)

    expect(html).toMatch(/<strong>9<\/strong><span>Precisa repor/)
    expect(html).toMatch(/<strong>2<\/strong><span>Sem estoque/)
    expect(html).toContain('href="/m/produtos/4"')
    expect(html).toContain('Marina')
  })

  it('o operador não vê o convite dos alertas nem a aba Repor', () => {
    sessao.papel = 'OPERADOR'
    const html = renderizar('/m', '/m', InicioMovel)

    expect(html).not.toContain('Ativar alertas')
    expect(html).not.toContain('href="/m/repor"')
  })
})

describe('Produto no celular', () => {
  it('com saldo zero, a saída fica desabilitada e a entrada não', () => {
    const html = renderizar('/m/produtos/9', '/m/produtos/:id', ProdutoMovel)

    expect(html).toMatch(/<button type="button" class="movel-botao movel-botao-secundario" disabled="">.*?Saída/)
    expect(html).toMatch(/<button type="button" class="movel-botao movel-botao-primario">.*?Entrada/)
  })

  it('mostra a sugestão de compra ao gestor e o contato do fornecedor', () => {
    const html = renderizar('/m/produtos/9', '/m/produtos/:id', ProdutoMovel)

    expect(html).toContain('12 un')
    expect(html).toContain('https://wa.me/5547998124410')
    expect(html).toContain('(47) 99812-4410')
  })

  it('o operador não vê a sugestão de compra', () => {
    sessao.papel = 'OPERADOR'
    const html = renderizar('/m/produtos/9', '/m/produtos/:id', ProdutoMovel)

    expect(html).not.toContain('Sugestão de compra')
  })

  it('produto fora do catálogo não oferece registrar', () => {
    produtoAtual.valor = { ...GOLDEN, ativo: false }
    const html = renderizar('/m/produtos/9', '/m/produtos/:id', ProdutoMovel)

    expect(html).toContain('saiu do catálogo')
    expect(html).not.toContain('Entrada</button>')
  })
})

describe('LinhaMovimentacao', () => {
  it('no ajuste, o sinal sai da diferença de saldo', () => {
    const html = renderToStaticMarkup(
      createElement(LinhaMovimentacao, {
        agora: new Date(),
        movimentacao: {
          id: 1,
          produtoId: 9,
          tipo: 'AJUSTE',
          motivo: 'AJUSTE_INVENTARIO',
          quantidade: 7,
          saldoAnterior: 10,
          saldoPosterior: 7,
          criadoEm: new Date().toISOString(),
          usuario: { nome: 'Marina Souza' },
        },
      }),
    )

    expect(html).toContain('movel-mov-qtd-saida')
    expect(html).toContain('−3')
    expect(html).toContain('10 → 7')
  })
})
