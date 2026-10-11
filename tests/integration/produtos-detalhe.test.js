import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('GET /api/produtos/:id', () => {
  let app
  let cliente
  let hashSenha
  let comFornecedor
  let semFornecedor

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Detalhe', 'detalhe.operador@exemplo.com', $1, 'OPERADOR')`,
      [hashSenha],
    )
    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('[teste] Detalhe') returning id`,
    )
    const { rows: fornecedores } = await obterPool().query(
      `insert into public.fornecedores (nome, contato_nome, telefone, email)
       values ('Litoral Pet Detalhe', 'Rogério', '47998124410', 'vendas@litoral.com.br')
       returning id`,
    )
    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual, estoque_minimo, ativo)
       values ('Ração Detalhe 15kg', $1, $2, 189.90, 2, 6, true),
              ('Brinquedo Fora do Catálogo', $1, null, 15.00, 0, 0, false)
       returning id`,
      [categorias[0].id, fornecedores[0].id],
    )
    ;[comFornecedor, semFornecedor] = produtos.map((p) => p.id)

    cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email: 'detalhe.operador@exemplo.com', senha: SENHA })
  })

  afterEach(desfazerTransacao)

  it('exige sessão', async () => {
    const resposta = await request(app).get(`/api/produtos/${comFornecedor}`)

    expect(resposta.status).toBe(401)
  })

  it('devolve o produto com status e o contato do fornecedor', async () => {
    const resposta = await cliente.get(`/api/produtos/${comFornecedor}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toMatchObject({
      id: comFornecedor,
      nome: 'Ração Detalhe 15kg',
      precoVenda: 189.9,
      quantidadeAtual: 2,
      estoqueMinimo: 6,
      statusEstoque: 'CRITICO',
      ativo: true,
      fornecedor: {
        nome: 'Litoral Pet Detalhe',
        contatoNome: 'Rogério',
        telefone: '47998124410',
        email: 'vendas@litoral.com.br',
      },
    })
  })

  it('abre também produto inativo, sem fornecedor', async () => {
    const resposta = await cliente.get(`/api/produtos/${semFornecedor}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toMatchObject({ ativo: false, fornecedor: null, statusEstoque: 'SEM_ESTOQUE' })
  })

  it('responde 404 para id que não existe', async () => {
    const resposta = await cliente.get('/api/produtos/999999999')

    expect(resposta.status).toBe(404)
    expect(resposta.body.erro.mensagem).toBe('Produto não encontrado.')
  })

  it('a listagem continua trazendo só o nome do fornecedor', async () => {
    const resposta = await cliente.get('/api/produtos').query({ busca: 'Ração Detalhe' })

    expect(resposta.body.dados[0].fornecedor).toEqual({ id: expect.any(Number), nome: 'Litoral Pet Detalhe' })
  })
})
