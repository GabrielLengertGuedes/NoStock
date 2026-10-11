import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const NOME = 'Fornecedor Teste Automatizado' // o banco é compartilhado: nome que ninguém cadastra à mão
const CNPJ_VALIDO = '19.980.203/0001-10'
const CNPJ_VALIDO_LIMPO = '19980203000110'
const CNPJ_INVALIDO = '19.980.203/0001-11' // digito errado
const SENHA = 'Senha123'
const TELEFONE = '(47) 99999-8888'

describe.skipIf(!temBanco())('/api/fornecedores', () => {
  let app
  let cliente
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()
    await obterPool().query(
      `insert into usuarios (nome, email, senha_hash, papel, ativo)
       values ($1, $2, $3, 'GESTOR', true), ($4, $5, $3, 'OPERADOR', true)`,
      [
        'Gestor Fornecedores',
        'teste.fornecedores.gestor@exemplo.com',
        hashSenha,
        'Operador Fornecedores',
        'teste.fornecedores.operador@exemplo.com',
      ],
    )
    cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({
      email: 'teste.fornecedores.gestor@exemplo.com',
      senha: SENHA,
    })
  })

  afterEach(desfazerTransacao)

  // Telefone ou e-mail e obrigatorio: os casos que nao testam isso levam o telefone padrao.
  const criar = (corpo) => cliente.post('/api/fornecedores').send({ telefone: TELEFONE, ...corpo })

  it('recusa leitura sem sessao com 401', async () => {
    const resposta = await request(app).get('/api/fornecedores')

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('permite leitura autenticada para operador com 200', async () => {
    const operador = request.agent(app)
    await operador.post('/api/auth/login').send({
      email: 'teste.fornecedores.operador@exemplo.com',
      senha: SENHA,
    })

    const resposta = await operador.get('/api/fornecedores')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toBeInstanceOf(Array)
  })

  it('recusa escrita de operador com 403', async () => {
    const operador = request.agent(app)
    await operador.post('/api/auth/login').send({
      email: 'teste.fornecedores.operador@exemplo.com',
      senha: SENHA,
    })

    const criarResposta = await operador.post('/api/fornecedores').send({ nome: NOME })
    const atualizarResposta = await operador.put('/api/fornecedores/1').send({ nome: `${NOME} atualizado` })
    const inativarResposta = await operador.delete('/api/fornecedores/1')

    expect(criarResposta.status).toBe(403)
    expect(atualizarResposta.status).toBe(403)
    expect(inativarResposta.status).toBe(403)
    expect(criarResposta.body.erro.codigo).toBe('SEM_PERMISSAO')
  })

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

  it('recusa fornecedor sem telefone e sem e-mail com 422', async () => {
    const resposta = await criar({ nome: NOME, telefone: '', email: '' })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.campos.telefone).toBe('Informe um telefone ou um e-mail')
    expect(resposta.body.erro.campos.email).toBe('Informe um telefone ou um e-mail')
  })

  it('aceita so o e-mail como contato', async () => {
    const resposta = await criar({ nome: NOME, telefone: null, email: 'compras@petsul.com.br' })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.telefone).toBeNull()
  })

  it('guarda o telefone so com digitos, sem o 55 do pais', async () => {
    const resposta = await criar({ nome: NOME, telefone: '+55 (47) 99999-8888' })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.telefone).toBe('47999998888')
  })

  it('recusa telefone sem DDD com 422', async () => {
    const resposta = await criar({ nome: NOME, telefone: '9999-8888' })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.campos.telefone).toBe('Informe o telefone com DDD')
  })

  it('recusa nome de fornecedor ativo repetido, ignorando caixa e acento, com 409', async () => {
    await criar({ nome: 'Distribuidora Teste Duplicada' })
    const resposta = await criar({ nome: 'distribuidora teste duplicadá' })

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro.codigo).toBe('CONFLITO')
    expect(resposta.body.erro.campos.nome).toBeDefined()
  })

  it('permite salvar o fornecedor mantendo o proprio nome', async () => {
    const criado = await criar({ nome: NOME })

    const resposta = await cliente
      .put(`/api/fornecedores/${criado.body.dados.id}`)
      .send({ nome: NOME, telefone: TELEFONE, observacao: 'Entrega às terças' })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.observacao).toBe('Entrega às terças')
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

  it('aceita o CNPJ alfanumerico e guarda em maiuscula', async () => {
    const resposta = await criar({ nome: NOME, cnpj: '12.abc.345/01de-35' })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.cnpj).toBe('12ABC34501DE35')
  })

  it('recusa CNPJ alfanumerico com digito verificador errado com 422', async () => {
    const resposta = await criar({ nome: NOME, cnpj: '12.ABC.345/01DE-36' })

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.campos.cnpj).toBe('CNPJ inválido')
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

    const resposta = await cliente.delete(`/api/fornecedores/${fornecedorId}`)
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

    const resposta = await cliente.get('/api/fornecedores')
    expect(resposta.status).toBe(200)

    const fornecedor = resposta.body.dados.find((f) => f.id === fornecedorId)
    expect(fornecedor.totalProdutos).toBe(2)
  })
  it('reativa fornecedor inativo e recusa reativar o que ja esta ativo', async () => {
    const { body } = await criar({ nome: NOME })
    const id = body.dados.id
    expect((await cliente.delete(`/api/fornecedores/${id}`)).status).toBe(204)

    expect((await cliente.post(`/api/fornecedores/${id}/reativar`)).status).toBe(204)
    const padrao = await cliente.get('/api/fornecedores')
    expect(padrao.body.dados.map((f) => f.id)).toContain(id)

    const deNovo = await cliente.post(`/api/fornecedores/${id}/reativar`)
    expect(deNovo.status).toBe(400)
    expect(deNovo.body.erro.codigo).toBe('REGRA_NEGOCIO')
  })

  it('nao reativa fornecedor cujo nome ja foi reusado por outro ativo', async () => {
    const { body } = await criar({ nome: NOME })
    await cliente.delete(`/api/fornecedores/${body.dados.id}`)
    expect((await criar({ nome: NOME })).status).toBe(201)

    const resposta = await cliente.post(`/api/fornecedores/${body.dados.id}/reativar`)
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro.codigo).toBe('CONFLITO')
  })
})
