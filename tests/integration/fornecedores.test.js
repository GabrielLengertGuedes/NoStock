import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const NOME = 'Fornecedor Teste'
const CNPJ_VALIDO = '19.980.203/0001-10'
const CNPJ_VALIDO_LIMPO = '19980203000110'
const CNPJ_INVALIDO = '19.980.203/0001-11' // digito errado

describe.skipIf(!temBanco())('/api/fornecedores', () => {
  let app

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()
  })

  afterEach(desfazerTransacao)

  const criar = (corpo) => request(app).post('/api/fornecedores').send(corpo)

  it('cria e devolve 201 com o fornecedor e limpa CNPJ', async () => {
    const resposta = await criar({ nome: NOME, cnpj: CNPJ_VALIDO, observacao: 'Fornecedor A' })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      nome: NOME,
      cnpj: CNPJ_VALIDO_LIMPO,
      observacao: 'Fornecedor A',
      ativo: true,
    })
    expect(resposta.body.dados.id).toBeGreaterThan(0)
  })

  it('recusa CNPJ com erro de validação (digito verificador) com 422', async () => {
    const resposta = await criar({ nome: NOME, cnpj: CNPJ_INVALIDO })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    expect(resposta.body.erro.campos.cnpj).toBeDefined()
  })

  it('recusa CNPJ repetido com 409', async () => {
    await criar({ nome: NOME, cnpj: CNPJ_VALIDO })
    const resposta = await criar({ nome: 'Outro', cnpj: CNPJ_VALIDO })

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro.codigo).toBe('CONFLITO')
    expect(resposta.body.erro.campos.cnpj).toBeDefined()
  })

  it('permite criar multiplos fornecedores sem CNPJ', async () => {
    const r1 = await criar({ nome: 'Um' })
    const r2 = await criar({ nome: 'Dois', cnpj: '' })
    
    expect(r1.status).toBe(201)
    expect(r2.status).toBe(201)
  })

  it('recusa inativar fornecedor com produtos ativos (RN08) com 400', async () => {
    const resFornecedor = await criar({ nome: NOME })
    const fornecedorId = resFornecedor.body.dados.id

    // precisamos de uma categoria para o produto
    const { obterPool } = await import('../../server/db/pool.js')
    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Cat Teste') returning id`
    )
    const categoriaId = categorias[0].id

    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, fornecedor_id, preco_venda) values ($1, $2, $3, $4)`,
      ['Produto Ativo', categoriaId, fornecedorId, 10.0]
    )

    const resposta = await request(app).delete(`/api/fornecedores/${fornecedorId}`)
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('traz o agregado totalProdutos na listagem', async () => {
    const resFornecedor = await criar({ nome: NOME })
    const fornecedorId = resFornecedor.body.dados.id

    const { obterPool } = await import('../../server/db/pool.js')
    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Cat Teste') returning id`
    )
    const categoriaId = categorias[0].id

    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual) values ($1, $2, $3, $4, $5)`,
      ['Produto 1', categoriaId, fornecedorId, 10.0, 5]
    )
    await obterPool().query(
      `insert into public.produtos (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual) values ($1, $2, $3, $4, $5)`,
      ['Produto 2', categoriaId, fornecedorId, 20.0, 3]
    )

    const resposta = await request(app).get('/api/fornecedores')
    expect(resposta.status).toBe(200)

    const fornecedor = resposta.body.dados.find((f) => f.id === fornecedorId)
    expect(fornecedor.totalProdutos).toBe(2)
  })
})
