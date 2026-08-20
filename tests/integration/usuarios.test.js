import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { resetarLimitadorDeLogin } from '../../server/modules/auth/rateLimiter.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha1234'
const GESTOR = 'teste.f103.gestor@exemplo.com'
const OPERADOR = 'teste.f103.op@exemplo.com'

async function entrar(app, email = GESTOR) {
  const cliente = request.agent(app)
  const login = await cliente.post('/api/auth/login').send({ email, senha: SENHA })
  expect(login.status).toBe(200)
  return cliente
}

describe.skipIf(!temBanco())('/api/usuarios', () => {
  let app
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  beforeEach(async () => {
    await resetarLimitadorDeLogin()
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `
      insert into usuarios (nome, email, senha_hash, papel, ativo)
      values
        ('Gestor F103', $2, $1, 'GESTOR', true),
        ('Operador F103', $3, $1, 'OPERADOR', true)
      `,
      [hashSenha, GESTOR, OPERADOR],
    )
  })

  afterEach(desfazerTransacao)

  it('operador recebe 403 na area de usuarios', async () => {
    const cliente = await entrar(app, OPERADOR)
    const resposta = await cliente.get('/api/usuarios')

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
  })

  it('cria usuario e nunca devolve o hash', async () => {
    const cliente = await entrar(app)
    const resposta = await cliente.post('/api/usuarios').send({
      nome: 'Novo Operador',
      email: 'teste.f103.novo@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      nome: 'Novo Operador',
      email: 'teste.f103.novo@exemplo.com',
      papel: 'OPERADOR',
      ativo: true,
    })
    expect(resposta.body.dados).not.toHaveProperty('senha_hash')
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha_hash/)

    const { rows } = await obterPool().query(
      'select senha_hash from usuarios where email = $1',
      ['teste.f103.novo@exemplo.com'],
    )
    expect(rows[0].senha_hash).not.toBe('inicial12')
    expect(await bcrypt.compare('inicial12', rows[0].senha_hash)).toBe(true)
  })

  it('trata Joao@ e joao@ como o mesmo e-mail', async () => {
    const cliente = await entrar(app)
    const primeira = await cliente.post('/api/usuarios').send({
      nome: 'Joao Operador',
      email: 'teste.f103.Joao@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })
    expect(primeira.status).toBe(201)
    expect(primeira.body.dados.email).toBe('teste.f103.joao@exemplo.com')

    const segunda = await cliente.post('/api/usuarios').send({
      nome: 'Outro Joao',
      email: 'teste.f103.joao@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })
    expect(segunda.status).toBe(409)
    expect(segunda.body.erro.codigo).toBe('CONFLITO')
  })

  it('recusa e-mail de usuario inativo como duplicado', async () => {
    const cliente = await entrar(app)
    const criado = await cliente.post('/api/usuarios').send({
      nome: 'Temporario',
      email: 'teste.f103.dup@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })

    await cliente.delete(`/api/usuarios/${criado.body.dados.id}`)

    const repetido = await cliente.post('/api/usuarios').send({
      nome: 'Outro Temporario',
      email: 'teste.f103.dup@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })
    expect(repetido.status).toBe(409)
    expect(repetido.body.erro.codigo).toBe('CONFLITO')
  })

  it('protege o ultimo gestor ativo contra inativacao e rebaixamento', async () => {
    const cliente = await entrar(app)
    await obterPool().query(
      `update usuarios set ativo = false where papel = 'GESTOR' and email <> $1`,
      [GESTOR],
    )

    const { rows } = await obterPool().query('select id from usuarios where email = $1', [GESTOR])
    const id = rows[0].id

    const inativar = await cliente.delete(`/api/usuarios/${id}`)
    expect(inativar.status).toBe(400)
    expect(inativar.body.erro.codigo).toBe('REGRA_NEGOCIO')

    const rebaixar = await cliente.put(`/api/usuarios/${id}`).send({
      nome: 'Gestor F103',
      email: GESTOR,
      papel: 'OPERADOR',
    })
    expect(rebaixar.status).toBe(400)
    expect(rebaixar.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('gestor redefine senha de outro usuario', async () => {
    const cliente = await entrar(app)
    const { rows } = await obterPool().query('select id from usuarios where email = $1', [OPERADOR])

    const resposta = await cliente.patch(`/api/usuarios/${rows[0].id}/senha`).send({
      senhaNova: 'novaSenha9',
    })
    expect(resposta.status).toBe(204)

    const login = await request(app).post('/api/auth/login').send({
      email: OPERADOR,
      senha: 'novaSenha9',
    })
    expect(login.status).toBe(200)
  })

  it('usuario troca a propria senha informando a atual', async () => {
    const cliente = await entrar(app)
    const ok = await cliente.patch('/api/auth/senha').send({
      senhaAtual: SENHA,
      senhaNova: 'outraSenha9',
    })
    expect(ok.status).toBe(204)

    const loginAntigo = await request(app).post('/api/auth/login').send({
      email: GESTOR,
      senha: SENHA,
    })
    expect(loginAntigo.status).toBe(401)

    const loginNovo = await request(app).post('/api/auth/login').send({
      email: GESTOR,
      senha: 'outraSenha9',
    })
    expect(loginNovo.status).toBe(200)

    const recusa = await cliente.patch('/api/auth/senha').send({
      senhaAtual: 'naoConfere',
      senhaNova: 'maisUma12',
    })
    expect(recusa.status).toBe(400)
    expect(recusa.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('lista ativos por padrao e reativa usuario inativo', async () => {
    const cliente = await entrar(app)
    const criado = await cliente.post('/api/usuarios').send({
      nome: 'Para Inativar',
      email: 'teste.f103.inativar@exemplo.com',
      senha: 'inicial12',
      papel: 'OPERADOR',
    })
    const id = criado.body.dados.id

    expect((await cliente.delete(`/api/usuarios/${id}`)).status).toBe(204)

    const ativos = await cliente.get('/api/usuarios')
    expect(ativos.status).toBe(200)
    expect(ativos.body.dados.map((u) => u.email)).not.toContain('teste.f103.inativar@exemplo.com')
    expect(JSON.stringify(ativos.body)).not.toMatch(/senha_hash/)

    const inativos = await cliente.get('/api/usuarios?ativo=false')
    expect(inativos.body.dados.map((u) => u.email)).toContain('teste.f103.inativar@exemplo.com')

    expect((await cliente.post(`/api/usuarios/${id}/reativar`)).status).toBe(204)

    const deNovo = await cliente.get(`/api/usuarios/${id}`)
    expect(deNovo.body.dados.ativo).toBe(true)
  })
})
