import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { requireRole } from '../../server/middlewares/auth.js'
import { errorHandler } from '../../server/middlewares/errorHandler.js'
import { resetarLimitadorDeLogin } from '../../server/modules/auth/rateLimiter.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

function appComRotaDeGestor() {
  const app = criarApp()
  app.get('/__teste/gestor', requireRole('GESTOR'), (_req, res) => {
    res.json({ dados: { ok: true } })
  })
  app.use(errorHandler)
  return app
}

describe.skipIf(!temBanco())('/api/auth', () => {
  let app
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  beforeEach(async () => {
    await resetarLimitadorDeLogin()
    await abrirTransacao()
    app = appComRotaDeGestor()

    await obterPool().query(
      `
      insert into usuarios (nome, email, senha_hash, papel, ativo)
      values
        ('Operador Ativo', 'teste.f102.op@exemplo.com', $1, 'OPERADOR', true),
        ('Gestor Ativo', 'teste.f102.gestor@exemplo.com', $1, 'GESTOR', true),
        ('Inativo', 'teste.f102.inativo@exemplo.com', $1, 'OPERADOR', false),
        ('Spammer', 'teste.f102.spam@exemplo.com', $1, 'OPERADOR', true)
      `,
      [hashSenha],
    )
  })

  afterEach(desfazerTransacao)

  it('login com credenciais validas retorna 200, usuario publico e cookie', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'teste.f102.op@exemplo.com',
      senha: SENHA,
    })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toEqual({
      id: expect.any(Number),
      nome: 'Operador Ativo',
      email: 'teste.f102.op@exemplo.com',
      papel: 'OPERADOR',
    })
    expect(resposta.body.dados).not.toHaveProperty('senha_hash')
    expect(resposta.headers['set-cookie']).toBeDefined()
  })

  it('login com email inexistente retorna 401 generico', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'naoexiste@exemplo.com',
      senha: SENHA,
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
    expect(resposta.body.erro.mensagem).toBe('E-mail ou senha inválidos')
  })

  it('login com senha errada retorna 401 generico', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'teste.f102.op@exemplo.com',
      senha: 'SenhaErrada',
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
    expect(resposta.body.erro.mensagem).toBe('E-mail ou senha inválidos')
  })

  it('usuario inativo e bloqueado com a mesma mensagem generica', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'teste.f102.inativo@exemplo.com',
      senha: SENHA,
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
    expect(resposta.body.erro.mensagem).toBe('E-mail ou senha inválidos')
  })

  it('limita tentativas de login (rate limit 429)', async () => {
    for (let i = 0; i < 5; i += 1) {
      const falha = await request(app)
        .post('/api/auth/login')
        .send({ email: 'teste.f102.spam@exemplo.com', senha: 'errada' })
      expect(falha.status).toBe(401)
    }

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste.f102.spam@exemplo.com', senha: 'errada' })

    expect(resposta.status).toBe(429)
    expect(resposta.body.erro.codigo).toBe('MUITAS_TENTATIVAS')
  })

  it('login bem-sucedido nao conta na cota de tentativas', async () => {
    for (let i = 0; i < 4; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'teste.f102.spam@exemplo.com', senha: 'errada' })
    }

    const sucesso = await request(app).post('/api/auth/login').send({
      email: 'teste.f102.spam@exemplo.com',
      senha: SENHA,
    })
    expect(sucesso.status).toBe(200)

    const aindaLivre = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste.f102.spam@exemplo.com', senha: 'errada' })
    expect(aindaLivre.status).toBe(401)
  })

  it('corpo sem email nao bloqueia outros logins', async () => {
    for (let i = 0; i < 6; i += 1) {
      const invalido = await request(app).post('/api/auth/login').send({ senha: SENHA })
      expect(invalido.status).toBe(422)
    }

    const resposta = await request(app).post('/api/auth/login').send({
      email: 'teste.f102.op@exemplo.com',
      senha: SENHA,
    })
    expect(resposta.status).toBe(200)
  })

  it('nao permite acessar /me sem sessao (401)', async () => {
    const resposta = await request(app).get('/api/auth/me')
    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('devolve o usuario autenticado em /me e encerra a sessao no logout', async () => {
    const cliente = request.agent(app)

    await cliente.post('/api/auth/login').send({
      email: 'teste.f102.gestor@exemplo.com',
      senha: SENHA,
    })

    const eu = await cliente.get('/api/auth/me')
    expect(eu.status).toBe(200)
    expect(eu.body.dados).toMatchObject({
      nome: 'Gestor Ativo',
      email: 'teste.f102.gestor@exemplo.com',
      papel: 'GESTOR',
    })
    expect(eu.body.dados).not.toHaveProperty('senha_hash')

    const saida = await cliente.post('/api/auth/logout')
    expect(saida.status).toBe(204)

    const depois = await cliente.get('/api/auth/me')
    expect(depois.status).toBe(401)
  })

  it('operador recebe 403 em rota de gestor', async () => {
    const cliente = request.agent(app)

    await cliente.post('/api/auth/login').send({
      email: 'teste.f102.op@exemplo.com',
      senha: SENHA,
    })

    const resposta = await cliente.get('/__teste/gestor')
    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
  })

  it('gestor acessa rota de gestor com sucesso', async () => {
    const cliente = request.agent(app)

    await cliente.post('/api/auth/login').send({
      email: 'teste.f102.gestor@exemplo.com',
      senha: SENHA,
    })

    const resposta = await cliente.get('/__teste/gestor')
    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.ok).toBe(true)
  })
})
