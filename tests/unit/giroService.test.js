import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../server/modules/relatorios/repository.js', () => ({
  obterVendasESaldoMedioPorProduto: vi.fn(),
  obterResumo: vi.fn(),
  obterRankingPorCategoria: vi.fn(),
  obterDistribuicaoPorCategoria: vi.fn(),
}))

import * as repositorio from '../../server/modules/relatorios/repository.js'
import { obterGiro } from '../../server/modules/relatorios/service.js'

describe('obterGiro (CA15.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usa saldo medio (abertura+fechamento)/2 e a formula do contrato', async () => {
    repositorio.obterVendasESaldoMedioPorProduto.mockResolvedValue([
      {
        id: 1,
        nome: 'Ração',
        categoria: { id: 1, nome: 'Ração' },
        unidadesVendidas: 20,
        saldoInicial: 100,
        saldoFinal: 80,
      },
      {
        id: 2,
        nome: 'Shampoo',
        categoria: { id: 2, nome: 'Higiene' },
        unidadesVendidas: 0,
        saldoInicial: 100,
        saldoFinal: 100,
      },
    ])

    const dados = await obterGiro({ de: '2026-01-01', ate: '2026-01-31' })

    expect(dados.formula).toBe('unidades vendidas no período ÷ saldo médio do período')
    expect(dados.produtos[0]).toMatchObject({ saldoMedio: 90, giro: 0.22 })
    expect(dados.produtos[1]).toMatchObject({ saldoMedio: 100, giro: 0 })
    expect(dados.geral).toMatchObject({ unidadesVendidas: 20, saldoMedio: 190, giro: 0.11 })
  })

  it('devolve giro nulo quando o saldo medio e zero', async () => {
    repositorio.obterVendasESaldoMedioPorProduto.mockResolvedValue([
      {
        id: 3,
        nome: 'Zerado',
        categoria: { id: 1, nome: 'Ração' },
        unidadesVendidas: 5,
        saldoInicial: 0,
        saldoFinal: 0,
      },
    ])

    const dados = await obterGiro({ de: '2026-01-01', ate: '2026-01-31' })

    expect(dados.produtos[0].giro).toBeNull()
    expect(dados.geral.giro).toBeNull()
  })
})
