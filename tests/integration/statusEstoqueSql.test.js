import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { statusEstoque, statusEstoqueSql } from '../../server/shared/statusEstoque.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const COMBINACOES = []
for (let saldo = 0; saldo <= 12; saldo += 1) {
  for (let minimo = 0; minimo <= 12; minimo += 1) {
    COMBINACOES.push([saldo, minimo])
  }
}

describe.skipIf(!temBanco())('statusEstoque em SQL', () => {
  let cliente

  beforeAll(async () => {
    cliente = await abrirTransacao()
  })

  afterAll(desfazerTransacao)

  it('concorda com a versao em JavaScript em todas as combinacoes', async () => {
    const valores = COMBINACOES.map(([s, m]) => `(${s}, ${m})`).join(', ')
    const { rows } = await cliente.query(
      `select saldo, minimo, ${statusEstoqueSql('saldo', 'minimo')} as status
       from (values ${valores}) as t(saldo, minimo)`,
    )

    expect(rows).toHaveLength(COMBINACOES.length)

    const divergentes = rows.filter((linha) => linha.status !== statusEstoque(linha.saldo, linha.minimo))
    expect(divergentes).toEqual([])
  })
})
