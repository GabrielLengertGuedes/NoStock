import { describe, expect, it } from 'vitest'

import { filtrosDeListagem } from '../../server/modules/movimentacoes/schema.js'

describe('filtrosDeListagem', () => {
  it('aceita filtros vazios com paginacao padrao', () => {
    const resultado = filtrosDeListagem.safeParse({})
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data).toMatchObject({ pagina: 1, porPagina: 20 })
    }
  })

  it('converte datas ISO-8601', () => {
    const resultado = filtrosDeListagem.safeParse({
      de: '2026-08-01T00:00:00-03:00',
      ate: '2026-08-31T23:59:59-03:00',
    })
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.de).toBeInstanceOf(Date)
      expect(resultado.data.ate).toBeInstanceOf(Date)
    }
  })

  it('rejeita periodo invertido', () => {
    const resultado = filtrosDeListagem.safeParse({
      de: '2026-08-10T00:00:00-03:00',
      ate: '2026-08-01T00:00:00-03:00',
    })
    expect(resultado.success).toBe(false)
  })
})
