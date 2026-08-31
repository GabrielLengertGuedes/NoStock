import bcrypt from 'bcrypt'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppError } from '../../server/shared/AppError.js'
import { obterPool } from '../../server/db/pool.js'
import * as servico from '../../server/modules/movimentacoes/service.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

describe.skipIf(!temBanco())('service de movimentacoes', () => {
  let categoriaId
  let produtoId
  let usuarioId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash('Senha123', 4)
  })

  beforeEach(async () => {
    await abrirTransacao()

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Mov Teste') returning id`,
    )
    categoriaId = categorias[0].id

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Mov', 'mov.teste@exemplo.com', $1, 'OPERADOR')
       returning id`,
      [hashSenha],
    )
    usuarioId = usuarios[0].id

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Produto Mov', $1, 25.50, 10, 8)
       returning id`,
      [categoriaId],
    )
    produtoId = produtos[0].id
  })

  afterEach(desfazerTransacao)

  const saldoAtual = async () => {
    const { rows } = await obterPool().query(
      `select quantidade_atual from public.produtos where id = $1`,
      [produtoId],
    )
    return rows[0].quantidade_atual
  }

  const totalMovimentacoes = async () => {
    const { rows } = await obterPool().query(
      `select count(*)::int as n from public.movimentacoes where produto_id = $1`,
      [produtoId],
    )
    return rows[0].n
  }

  it('registra saida e atualiza saldo atomicamente (RN01, ADR-004)', async () => {
    const movimentacao = await servico.registrar({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 3,
      usuarioId,
    })

    expect(movimentacao).toMatchObject({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 3,
      saldoAnterior: 10,
      saldoPosterior: 7,
      precoUnitario: 25.5,
      usuario: { id: usuarioId, nome: 'Operador Mov' },
      statusEstoqueResultante: 'BAIXO',
    })
    expect(movimentacao.criadoEm).toBeTruthy()
    expect(await saldoAtual()).toBe(7)
    expect(await totalMovimentacoes()).toBe(1)
  })

  it('registra entrada e soma ao saldo', async () => {
    const movimentacao = await servico.registrar({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      quantidade: 5,
      usuarioId,
    })

    expect(movimentacao.saldoAnterior).toBe(10)
    expect(movimentacao.saldoPosterior).toBe(15)
    expect(await saldoAtual()).toBe(15)
  })

  it('rejeita saida com saldo insuficiente sem alterar o estoque (CA5.2)', async () => {
    await expect(
      servico.registrar({
        produtoId,
        tipo: 'SAIDA',
        motivo: 'VENDA',
        quantidade: 11,
        usuarioId,
      }),
    ).rejects.toMatchObject({
      codigo: 'SALDO_INSUFICIENTE',
      message: 'Saldo insuficiente: o produto tem 10 unidades disponíveis.',
      campos: { quantidade: 'Máximo disponível: 10' },
    })

    expect(await saldoAtual()).toBe(10)
    expect(await totalMovimentacoes()).toBe(0)
  })

  it('rejeita combinacao invalida de tipo e motivo (RN04)', async () => {
    await expect(
      servico.registrar({
        produtoId,
        tipo: 'ENTRADA',
        motivo: 'VENDA',
        quantidade: 1,
        usuarioId,
      }),
    ).rejects.toMatchObject({
      codigo: 'REGRA_NEGOCIO',
    })

    expect(await saldoAtual()).toBe(10)
    expect(await totalMovimentacoes()).toBe(0)
  })

  it('ajuste define saldo absoluto com observacao obrigatoria (RN03, RN04)', async () => {
    const movimentacao = await servico.registrar({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 4,
      observacao: 'Contagem física divergiu',
      usuarioId,
    })

    expect(movimentacao).toMatchObject({
      tipo: 'AJUSTE',
      quantidade: 4,
      saldoAnterior: 10,
      saldoPosterior: 4,
      observacao: 'Contagem física divergiu',
    })
    expect(await saldoAtual()).toBe(4)
  })

  it('ajuste permite saldo final zero', async () => {
    await servico.registrar({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 0,
      observacao: 'Estoque zerado na contagem',
      usuarioId,
    })

    expect(await saldoAtual()).toBe(0)
  })

  it('recusa ajuste sem observacao', async () => {
    await expect(
      servico.registrar({
        produtoId,
        tipo: 'AJUSTE',
        motivo: 'AJUSTE_INVENTARIO',
        quantidade: 5,
        observacao: '   ',
        usuarioId,
      }),
    ).rejects.toBeInstanceOf(AppError)

    expect(await saldoAtual()).toBe(10)
  })

  it('recusa movimentacao em produto inativo', async () => {
    await obterPool().query(`update public.produtos set ativo = false where id = $1`, [produtoId])

    await expect(
      servico.registrar({
        produtoId,
        tipo: 'SAIDA',
        motivo: 'VENDA',
        quantidade: 1,
        usuarioId,
      }),
    ).rejects.toMatchObject({ codigo: 'NAO_ENCONTRADO' })
  })
})
