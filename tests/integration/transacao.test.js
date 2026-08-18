import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { emTransacao } from '../../server/db/transaction.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const NOME = '[teste] isolamento'

describe.skipIf(!temBanco())('isolamento por transacao', () => {
  let cliente

  beforeEach(async () => {
    cliente = await abrirTransacao()
  })

  afterEach(desfazerTransacao)

  it('enxerga o que o proprio teste escreveu', async () => {
    await cliente.query('insert into public.categorias (nome) values ($1)', [NOME])

    const { rows } = await cliente.query(
      'select count(*)::int as n from public.categorias where nome = $1',
      [NOME],
    )
    expect(rows[0].n).toBe(1)
  })

  it('nao encontra o que o teste anterior escreveu', async () => {
    const { rows } = await cliente.query(
      'select count(*)::int as n from public.categorias where nome = $1',
      [NOME],
    )
    expect(rows[0].n).toBe(0)
  })

  it('desfaz tudo quando o bloco falha', async () => {
    await expect(
      emTransacao(async (conexao) => {
        await conexao.query('insert into public.categorias (nome) values ($1)', [NOME])
        throw new Error('falha de proposito')
      }),
    ).rejects.toThrow('falha de proposito')

    const { rows } = await cliente.query(
      'select count(*)::int as n from public.categorias where nome = $1',
      [NOME],
    )
    expect(rows[0].n).toBe(0)
  })

  it('mantem o que o bloco concluiu', async () => {
    await emTransacao((conexao) =>
      conexao.query('insert into public.categorias (nome) values ($1)', [NOME]),
    )

    const { rows } = await cliente.query(
      'select count(*)::int as n from public.categorias where nome = $1',
      [NOME],
    )
    expect(rows[0].n).toBe(1)
  })
})
