import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const NOME = '[teste] Camas'

describe.skipIf(!temBanco())('/api/categorias', () => {
  let app

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()
  })

  afterEach(desfazerTransacao)

  const criar = (corpo) => request(app).post('/api/categorias').send(corpo)

  it('cria e devolve 201 com a categoria', async () => {
    const resposta = await criar({ nome: NOME, descricao: 'Camas e colchonetes' })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      nome: NOME,
      descricao: 'Camas e colchonetes',
      ativo: true,
    })
    expect(resposta.body.dados.id).toBeGreaterThan(0)
  })

  it('recusa nome repetido com 409', async () => {
    await criar({ nome: NOME })
    const resposta = await criar({ nome: NOME })

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro.codigo).toBe('CONFLITO')
    expect(resposta.body.erro.campos.nome).toBeDefined()
  })

  it('recusa nome curto com 422 e detalhe por campo', async () => {
    const resposta = await criar({ nome: 'a' })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    expect(resposta.body.erro.campos.nome).toBeDefined()
  })

  it('lista em ordem de nome e traz as categorias base', async () => {
    const resposta = await request(app).get('/api/categorias')

    expect(resposta.status).toBe(200)
    const nomes = resposta.body.dados.map((c) => c.nome)
    expect(nomes).toContain('Ração')
    expect([...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'))).toEqual(nomes)
  })

  it('busca por id e responde 404 para id inexistente', async () => {
    const { body } = await criar({ nome: NOME })

    const achada = await request(app).get(`/api/categorias/${body.dados.id}`)
    expect(achada.status).toBe(200)
    expect(achada.body.dados.nome).toBe(NOME)

    const perdida = await request(app).get('/api/categorias/99999999')
    expect(perdida.status).toBe(404)
    expect(perdida.body.erro.codigo).toBe('NAO_ENCONTRADO')
  })

  it('recusa id que nao e numero com 422', async () => {
    const resposta = await request(app).get('/api/categorias/abc')

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
  })

  it('atualiza nome e descricao', async () => {
    const { body } = await criar({ nome: NOME, descricao: 'antes' })

    const resposta = await request(app)
      .put(`/api/categorias/${body.dados.id}`)
      .send({ nome: `${NOME} macias`, descricao: 'depois' })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toMatchObject({ nome: `${NOME} macias`, descricao: 'depois' })
  })

  it('inativa, some da listagem padrao e reaparece com incluirInativas', async () => {
    const { body } = await criar({ nome: NOME })

    const remocao = await request(app).delete(`/api/categorias/${body.dados.id}`)
    expect(remocao.status).toBe(204)

    const padrao = await request(app).get('/api/categorias')
    expect(padrao.body.dados.map((c) => c.nome)).not.toContain(NOME)

    const comInativas = await request(app).get('/api/categorias?incluirInativas=true')
    expect(comInativas.body.dados.map((c) => c.nome)).toContain(NOME)
  })

  it('nao inativa duas vezes', async () => {
    const { body } = await criar({ nome: NOME })
    await request(app).delete(`/api/categorias/${body.dados.id}`)

    const segunda = await request(app).delete(`/api/categorias/${body.dados.id}`)
    expect(segunda.status).toBe(400)
    expect(segunda.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('recusa inativar categoria com produtos ativos (RN08) com 400', async () => {
    const resCategoria = await criar({ nome: NOME })
    const categoriaId = resCategoria.body.dados.id

    const { obterPool } = await import('../../server/db/pool.js')
    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, preco_venda) values ($1, $2, $3)`,
      ['Produto Ativo', categoriaId, 10.0]
    )

    const resposta = await request(app).delete(`/api/categorias/${categoriaId}`)
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('traz os agregados totalProdutos e unidadesEmEstoque na listagem', async () => {
    const resCategoria = await criar({ nome: NOME })
    const categoriaId = resCategoria.body.dados.id

    const { obterPool } = await import('../../server/db/pool.js')
    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual) values ($1, $2, $3, $4)`,
      ['Produto 1', categoriaId, 10.0, 5]
    )
    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual) values ($1, $2, $3, $4)`,
      ['Produto 2', categoriaId, 20.0, 3]
    )

    const resposta = await request(app).get('/api/categorias')
    expect(resposta.status).toBe(200)

    const categoria = resposta.body.dados.find((c) => c.id === categoriaId)
    expect(categoria.totalProdutos).toBe(2)
    expect(categoria.unidadesEmEstoque).toBe(8)
  })
})
