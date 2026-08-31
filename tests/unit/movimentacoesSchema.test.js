import { describe, expect, it } from 'vitest'

import { corpoDeRegistro } from '../../server/modules/movimentacoes/schema.js'

describe('corpoDeRegistro', () => {
  const base = {
    produtoId: 1,
    tipo: 'SAIDA',
    motivo: 'VENDA',
    quantidade: 3,
  }

  it('aceita saida valida', () => {
    const resultado = corpoDeRegistro.safeParse(base)
    expect(resultado.success).toBe(true)
  })

  it('rejeita quantidade zero em saida', () => {
    const resultado = corpoDeRegistro.safeParse({ ...base, quantidade: 0 })
    expect(resultado.success).toBe(false)
  })

  it('aceita ajuste com saldo final zero', () => {
    const resultado = corpoDeRegistro.safeParse({
      produtoId: 1,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 0,
      observacao: 'Zerado',
    })
    expect(resultado.success).toBe(true)
  })

  it('rejeita ajuste sem observacao (RN03)', () => {
    const resultado = corpoDeRegistro.safeParse({
      produtoId: 1,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 5,
    })
    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path[0] === 'observacao')).toBe(true)
    }
  })

  it('rejeita estoque inicial pela API', () => {
    const resultado = corpoDeRegistro.safeParse({
      produtoId: 1,
      tipo: 'ENTRADA',
      motivo: 'ESTOQUE_INICIAL',
      quantidade: 5,
    })
    expect(resultado.success).toBe(false)
  })
})
