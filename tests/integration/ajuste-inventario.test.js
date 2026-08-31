import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('ajuste de inventario (F2-03, RN03, RN04)', () => {
  let app
  let produtoId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logarGestor = async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({
      email: 'ajuste.gestor@exemplo.com',
      senha: SENHA,
    })
    return cliente
  }

  const logarOperador = async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({
      email: 'ajuste.operador@exemplo.com',
      senha: SENHA,
    })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Ajuste', 'ajuste.operador@exemplo.com', $1, 'OPERADOR'),
              ('Gestor Ajuste', 'ajuste.gestor@exemplo.com', $1, 'GESTOR')`,
      [hashSenha],
    )

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Ajuste Teste') returning id`,
    )

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Produto Ajuste', $1, 50.00, 10, 8)
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

  const ajustar = (cliente, quantidade, observacao = 'Correção de inventário') =>
    cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade,
      observacao,
    })

  it('gestor define saldo final menor que o atual (RN03, RN04)', async () => {
    const cliente = await logarGestor()

    const resposta = await ajustar(cliente, 4, 'Contagem encontrou 4 unidades')

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 4,
      saldoAnterior: 10,
      saldoPosterior: 4,
      observacao: 'Contagem encontrou 4 unidades',
      statusEstoqueResultante: 'CRITICO',
    })
    expect(await saldoAtual()).toBe(4)
  })

  it('gestor define saldo final maior que o atual', async () => {
    const cliente = await logarGestor()

    const resposta = await ajustar(cliente, 15, 'Recontagem após erro de lançamento')

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.saldoAnterior).toBe(10)
    expect(resposta.body.dados.saldoPosterior).toBe(15)
    expect(await saldoAtual()).toBe(15)
  })

  it('gestor pode zerar o estoque com ajuste (RN04)', async () => {
    const cliente = await logarGestor()

    const resposta = await ajustar(cliente, 0, 'Produto vencido descartado na contagem')

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      quantidade: 0,
      saldoPosterior: 0,
      statusEstoqueResultante: 'SEM_ESTOQUE',
    })
    expect(await saldoAtual()).toBe(0)
  })

  it('operador nao pode registrar ajuste (RN10)', async () => {
    const cliente = await logarOperador()

    const resposta = await ajustar(cliente, 5)

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    expect(await saldoAtual()).toBe(10)
  })

  it('recusa ajuste sem observacao (RN03)', async () => {
    const cliente = await logarGestor()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 5,
    })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    expect(resposta.body.erro.campos.observacao).toBeTruthy()
    expect(await saldoAtual()).toBe(10)
  })

  it('recusa ajuste com motivo invalido (RN04)', async () => {
    const cliente = await logarGestor()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'VENDA',
      quantidade: 5,
      observacao: 'Tentativa inválida',
    })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.campos.motivo).toBeTruthy()
    expect(await saldoAtual()).toBe(10)
  })

  it('grava linha imutavel no historico em vez de editar movimentacao anterior (RN03)', async () => {
    const cliente = await logarGestor()

    await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 2,
    })

    const resposta = await ajustar(cliente, 10, 'Corrigindo saída lançada por engano')

    expect(resposta.status).toBe(201)

    const { rows } = await obterPool().query(
      `select tipo, saldo_anterior, saldo_posterior, observacao
         from public.movimentacoes
        where produto_id = $1
        order by id`,
      [produtoId],
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ tipo: 'SAIDA', saldo_anterior: 10, saldo_posterior: 8 })
    expect(rows[1]).toMatchObject({
      tipo: 'AJUSTE',
      saldo_anterior: 8,
      saldo_posterior: 10,
      observacao: 'Corrigindo saída lançada por engano',
    })
  })
})
