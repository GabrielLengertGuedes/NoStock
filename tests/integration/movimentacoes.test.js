import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('POST /api/movimentacoes', () => {
  let app
  let produtoId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logar = async (papel = 'OPERADOR') => {
    const email =
      papel === 'GESTOR' ? 'mov.api.gestor@exemplo.com' : 'mov.api.operador@exemplo.com'
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email, senha: SENHA })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Mov API', 'mov.api.operador@exemplo.com', $1, 'OPERADOR'),
              ('Gestor Mov API', 'mov.api.gestor@exemplo.com', $1, 'GESTOR')`,
      [hashSenha],
    )

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Mov API') returning id`,
    )

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Produto Mov API', $1, 189.90, 7, 6)
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

  it('registra saida e retorna saldos e status (RF04, RF05)', async () => {
    const cliente = await logar()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 3,
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 3,
      saldoAnterior: 7,
      saldoPosterior: 4,
      precoUnitario: 189.9,
      statusEstoqueResultante: 'CRITICO',
      usuario: { id: expect.any(Number), nome: 'Operador Mov API' },
    })
    expect(resposta.body.dados.criadoEm).toBeTruthy()
    expect(await saldoAtual()).toBe(4)
  })

  it('retorna 400 SALDO_INSUFICIENTE sem alterar o saldo (CA5.2)', async () => {
    const cliente = await logar()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 20,
    })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toEqual({
      codigo: 'SALDO_INSUFICIENTE',
      mensagem: 'Saldo insuficiente: o produto tem 7 unidades disponíveis.',
      campos: { quantidade: 'Máximo disponível: 7' },
    })
    expect(await saldoAtual()).toBe(7)
  })

  it('retorna 401 sem sessao', async () => {
    const resposta = await request(app).post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade: 1,
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('retorna 422 para combinacao invalida de tipo e motivo (RN04)', async () => {
    const cliente = await logar()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'VENDA',
      quantidade: 1,
    })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    expect(resposta.body.erro.campos.motivo).toBeTruthy()
  })

  it('recusa ESTOQUE_INICIAL pela API', async () => {
    const cliente = await logar()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'ESTOQUE_INICIAL',
      quantidade: 5,
    })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.campos.motivo).toContain('cadastro do produto')
  })

  it('ignora usuarioId e criadoEm enviados no corpo', async () => {
    const cliente = await logar()

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      quantidade: 2,
      usuarioId: 99999,
      criadoEm: '2020-01-01T00:00:00-03:00',
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.usuario.nome).toBe('Operador Mov API')
    expect(resposta.body.dados.criadoEm).not.toBe('2020-01-01T00:00:00-03:00')
  })

  it('operador nao pode registrar ajuste (RN10)', async () => {
    const cliente = await logar('OPERADOR')

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 5,
      observacao: 'Contagem física',
    })

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    expect(await saldoAtual()).toBe(7)
  })

  it('gestor registra ajuste com observacao', async () => {
    const cliente = await logar('GESTOR')

    const resposta = await cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'AJUSTE',
      motivo: 'AJUSTE_INVENTARIO',
      quantidade: 2,
      observacao: 'Divergência na contagem',
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      tipo: 'AJUSTE',
      quantidade: 2,
      saldoAnterior: 7,
      saldoPosterior: 2,
      observacao: 'Divergência na contagem',
    })
    expect(await saldoAtual()).toBe(2)
  })
})
