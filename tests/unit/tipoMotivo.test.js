import { describe, expect, it } from 'vitest'

import { combinaTipoMotivo, MOTIVOS_POR_TIPO } from '../../server/modules/movimentacoes/tipoMotivo.js'

describe('combinaTipoMotivo (RN04)', () => {
  it.each([
    ['ENTRADA', 'COMPRA', true],
    ['ENTRADA', 'DEVOLUCAO', true],
    ['ENTRADA', 'ESTOQUE_INICIAL', true],
    ['ENTRADA', 'AJUSTE_INVENTARIO', true],
    ['ENTRADA', 'VENDA', false],
    ['SAIDA', 'VENDA', true],
    ['SAIDA', 'DESCARTE', true],
    ['SAIDA', 'AJUSTE_INVENTARIO', true],
    ['SAIDA', 'COMPRA', false],
    ['AJUSTE', 'AJUSTE_INVENTARIO', true],
    ['AJUSTE', 'VENDA', false],
  ])('tipo %s com motivo %s → %s', (tipo, motivo, esperado) => {
    expect(combinaTipoMotivo(tipo, motivo)).toBe(esperado)
  })

  it('cobre todos os motivos da RN04', () => {
    const motivos = new Set(Object.values(MOTIVOS_POR_TIPO).flat())
    expect(motivos).toEqual(
      new Set([
        'COMPRA',
        'DEVOLUCAO',
        'ESTOQUE_INICIAL',
        'AJUSTE_INVENTARIO',
        'VENDA',
        'DESCARTE',
      ]),
    )
  })
})
