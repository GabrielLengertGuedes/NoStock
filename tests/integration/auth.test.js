import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import bcrypt from 'bcrypt'

import { criarApp } from '../../server/app.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'
import { requireRole } from '../../server/middlewares/auth.js'
import { errorHandler } from '../../server/middlewares/errorHandler.js'

describe.skipIf(!temBanco())('/api/auth', () => {
  let app
  let cliente

  beforeEach(async () => {
    cliente = await abrirTransacao()
    app = criarApp()

    // Injeta rota fake para testar o requireRole GESTOR (fora do /api para não cair no 404 genérico)
    app.get('/teste-gestor', requireRole('GESTOR'), (_req, res) => res.json({ ok: true }))
    app.use('/teste-gestor', errorHandler)

    const hash = await bcrypt.hash('Senha123', 12)

    await cliente.query(
      `
      insert into usuarios (nome, email, senha_hash, papel, ativo)
      values 
        ('Operador Ativo', 'op@teste.com', $1, 'OPERADOR', true),
        ('Gestor Ativo', 'gestor@teste.com', $1, 'GESTOR', true),
        ('Inativo', 'inativo@teste.com', $1, 'OPERADOR', false),
        ('Spammer', 'spam@teste.com', $1, 'OPERADOR', true)
      `,
      [hash]
    )
  })

  afterEach(desfazerTransacao)

  it('login com credenciais validas retorna 200 e set-cookie', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'op@teste.com',
      senha: 'Senha123',
    })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.nome).toBe('Operador Ativo')
    expect(resposta.headers['set-cookie']).toBeDefined()
  })

  it('login com email inexistente retorna 401 generico', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'naoexiste@teste.com',
      senha: 'Senha123',
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.mensagem).toMatch(/inválidas/i)
  })

  it('login com senha errada retorna 401 generico', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'op@teste.com',
      senha: 'SenhaErrada',
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.mensagem).toMatch(/inválidas/i)
  })

  it('usuario inativo e bloqueado no login (403/401)', async () => {
    const resposta = await request(app).post('/api/auth/login').send({
      email: 'inativo@teste.com',
      senha: 'Senha123',
    })

    expect([401, 403]).toContain(resposta.status)
    expect(resposta.body.erro.mensagem).toMatch(/bloqueado/i)
  })

  it('limita tentativas de login (rate limit 429)', async () => {
    // 5 tentativas erradas
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'spam@teste.com', senha: '123' })
    }

    // 6a tentativa deve dar 429
    const resposta = await request(app).post('/api/auth/login').send({ email: 'spam@teste.com', senha: '123' })

    expect(resposta.status).toBe(429)
    expect(resposta.body.erro.codigo).toBe('MUITAS_TENTATIVAS')
  })

  it('nao permite acessar /me sem sessao (401)', async () => {
    const resposta = await request(app).get('/api/auth/me')
    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('operador recebe 403 em rota de gestor', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'op@teste.com',
      senha: 'Senha123',
    })
    const cookie = login.headers['set-cookie']

    const resposta = await request(app).get('/teste-gestor').set('Cookie', cookie)

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
  })

  it('gestor acessa rota de gestor com sucesso', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'gestor@teste.com',
      senha: 'Senha123',
    })
    const cookie = login.headers['set-cookie']

    const resposta = await request(app).get('/teste-gestor').set('Cookie', cookie)
    expect(resposta.status).toBe(200)
  })
})
