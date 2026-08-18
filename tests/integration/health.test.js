import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

describe.skipIf(!temBanco())('GET /api/health', () => {
  let app

  beforeAll(async () => {
    await abrirTransacao()
    app = criarApp()
  })

  afterAll(desfazerTransacao)

  it('responde 200 com o banco acessivel', async () => {
    const resposta = await request(app).get('/api/health')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.status).toBe('ok')
    expect(resposta.body.dados.banco).toBe('ok')
  })

  it('responde 404 no envelope de erro para rota inexistente', async () => {
    const resposta = await request(app).get('/api/nao-existe')

    expect(resposta.status).toBe(404)
    expect(resposta.body.erro.codigo).toBe('NAO_ENCONTRADO')
  })

  it('nao expoe o servidor no cabecalho', async () => {
    const resposta = await request(app).get('/api/health')

    expect(resposta.headers['x-powered-by']).toBeUndefined()
    expect(resposta.headers['x-content-type-options']).toBe('nosniff')
  })
})
