import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import * as servico from '../../server/modules/movimentacoes/service.js'
import { auditoriaDoProduto, semProblemas } from '../helpers/integridade.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('F2-05 — saldo nunca negativo (RN01, CA5.2)', () => {
  let app
  let produtoId
  let usuarioId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador RN01', 'rn01.teste@exemplo.com', $1, 'OPERADOR')
       returning id`,
      [hashSenha],
    )
    usuarioId = usuarios[0].id

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('RN01 Teste') returning id`,
    )

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Produto RN01', $1, 10.00, 2, 5)
       returning id`,
      [categorias[0].id],
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

  const saida = (quantidade) =>
    servico.registrar({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade,
      usuarioId,
    })

  it('CA5.2 — rejeita saida maior que o saldo e mantém o estoque intacto (service)', async () => {
    await expect(saida(5)).rejects.toMatchObject({
      codigo: 'SALDO_INSUFICIENTE',
      message: 'Saldo insuficiente: o produto tem 2 unidades disponíveis.',
      campos: { quantidade: 'Máximo disponível: 2' },
    })

    expect(await saldoAtual()).toBe(2)
    expect(await totalMovimentacoes()).toBe(0)
    expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
  })

  it('CA5.2 — rejeita saida maior que o saldo e mantém o estoque intacto (API)', async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email: 'rn01.teste@exemplo.com', senha: SENHA })

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 5,
    })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toEqual({
      codigo: 'SALDO_INSUFICIENTE',
      mensagem: 'Saldo insuficiente: o produto tem 2 unidades disponíveis.',
      campos: { quantidade: 'Máximo disponível: 2' },
    })
    expect(await saldoAtual()).toBe(2)
    expect(await totalMovimentacoes()).toBe(0)
  })

  it('permite saida que zera o saldo sem ficar negativo', async () => {
    const movimentacao = await saida(2)

    expect(movimentacao.saldoPosterior).toBe(0)
    expect(movimentacao.statusEstoqueResultante).toBe('SEM_ESTOQUE')
    expect(await saldoAtual()).toBe(0)
    expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
  })

  it('com saldo zero, qualquer saida é rejeitada', async () => {
    await saida(2)

    await expect(saida(1)).rejects.toMatchObject({ codigo: 'SALDO_INSUFICIENTE' })

    expect(await saldoAtual()).toBe(0)
    expect(await totalMovimentacoes()).toBe(1)
  })

  it('várias tentativas inválidas seguidas não alteram o saldo', async () => {
    for (const quantidade of [3, 10, 99]) {
      await expect(saida(quantidade)).rejects.toMatchObject({
        codigo: 'SALDO_INSUFICIENTE',
      })
    }

    expect(await saldoAtual()).toBe(2)
    expect(await totalMovimentacoes()).toBe(0)
  })

  it('falha de saida após entrada válida não desfaz a entrada', async () => {
    await servico.registrar({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      quantidade: 3,
      usuarioId,
    })
    expect(await saldoAtual()).toBe(5)

    await expect(saida(6)).rejects.toMatchObject({ codigo: 'SALDO_INSUFICIENTE' })

    expect(await saldoAtual()).toBe(5)
    expect(await totalMovimentacoes()).toBe(1)
    expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
  })
})
