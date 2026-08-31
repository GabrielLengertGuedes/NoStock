import bcrypt from 'bcrypt'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { obterPool } from '../../server/db/pool.js'
import * as repositorio from '../../server/modules/movimentacoes/repository.js'
import * as servico from '../../server/modules/movimentacoes/service.js'
import { auditoriaDoProduto, semProblemas } from '../helpers/integridade.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

describe.skipIf(!temBanco())('F2-06 — toda alteração de saldo gera movimentação (RN02)', () => {
  let produtoId
  let usuarioId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash('Senha123', 4)
  })

  beforeEach(async () => {
    await abrirTransacao()

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador RN02', 'rn02.teste@exemplo.com', $1, 'OPERADOR')
       returning id`,
      [hashSenha],
    )
    usuarioId = usuarios[0].id

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('RN02 Teste') returning id`,
    )

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Produto RN02', $1, 12.00, 5, 3)
       returning id`,
      [categorias[0].id],
    )
    produtoId = produtos[0].id
  })

  afterEach(() => {
    vi.restoreAllMocks()
    return desfazerTransacao()
  })

  const saldoAtual = async () => {
    const { rows } = await obterPool().query(
      `select quantidade_atual from public.produtos where id = $1`,
      [produtoId],
    )
    return rows[0].quantidade_atual
  }

  const ultimaMovimentacao = async () => {
    const { rows } = await obterPool().query(
      `select tipo, motivo, quantidade, saldo_anterior, saldo_posterior
         from public.movimentacoes
        where produto_id = $1
        order by id desc
        limit 1`,
      [produtoId],
    )
    return rows[0] ?? null
  }

  it('entrada altera saldo e grava movimentação coerente', async () => {
    await servico.registrar({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      quantidade: 4,
      usuarioId,
    })

    expect(await saldoAtual()).toBe(9)
    expect(await ultimaMovimentacao()).toMatchObject({
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      quantidade: 4,
      saldo_anterior: 5,
      saldo_posterior: 9,
    })
    expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
  })

  it('saída altera saldo e grava movimentação coerente', async () => {
    await servico.registrar({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 2,
      usuarioId,
    })

    expect(await saldoAtual()).toBe(3)
    expect(await ultimaMovimentacao()).toMatchObject({
      tipo: 'SAIDA',
      saldo_anterior: 5,
      saldo_posterior: 3,
    })
    expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
  })

  it('faz rollback completo quando o INSERT da movimentação falha', async () => {
    vi.spyOn(repositorio, 'inserirMovimentacao').mockRejectedValueOnce(
      new Error('falha simulada no insert'),
    )

    await expect(
      servico.registrar({
        produtoId,
        tipo: 'ENTRADA',
        motivo: 'COMPRA',
        quantidade: 1,
        usuarioId,
      }),
    ).rejects.toThrow('falha simulada no insert')

    expect(await saldoAtual()).toBe(5)

    const { rows } = await obterPool().query(
      `select count(*)::int as n from public.movimentacoes where produto_id = $1`,
      [produtoId],
    )
    expect(rows[0].n).toBe(0)
  })
})
