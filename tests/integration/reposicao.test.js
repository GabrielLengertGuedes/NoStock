import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('/api/reposicao', () => {
  let app
  let categoriaId
  let fornecedorId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logar = async (papel) => {
    const email = papel === 'GESTOR' ? 'reposicao.gestor@exemplo.com' : 'reposicao.operador@exemplo.com'
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email, senha: SENHA })
    return cliente
  }

  const criarProduto = ({ nome, quantidadeAtual, estoqueMinimo, fornecedorId: forn = null, ativo = true }) =>
    obterPool()
      .query(
        `insert into public.produtos
           (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual, estoque_minimo, ativo)
         values ($1, $2, $3, 10.00, $4, $5, $6)
         returning id`,
        [nome, categoriaId, forn, quantidadeAtual, estoqueMinimo, ativo],
      )
      .then(({ rows }) => rows[0].id)

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Reposicao', 'reposicao.operador@exemplo.com', $1, 'OPERADOR'),
              ('Gestor Reposicao', 'reposicao.gestor@exemplo.com', $1, 'GESTOR')`,
      [hashSenha],
    )

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Categoria Reposição') returning id`,
    )
    categoriaId = categorias[0].id

    const { rows: fornecedores } = await obterPool().query(
      `insert into public.fornecedores (nome, contato_nome, telefone, email)
       values ('Distribuidora Pet Sul', 'Carlos', '47999998888', 'vendas@petsul.com.br')
       returning id`,
    )
    fornecedorId = fornecedores[0].id
  })

  afterEach(desfazerTransacao)

  it('recusa acesso de operador com 403', async () => {
    const cliente = await logar('OPERADOR')

    const resposta = await cliente.get('/api/reposicao')

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
  })

  it('recusa acesso sem sessao com 401', async () => {
    const resposta = await request(app).get('/api/reposicao')

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('quando nao ha produto a repor, devolve totalItens 0 e grupos vazios (CA13.6)', async () => {
    await criarProduto({ nome: 'Estoque em dia', quantidadeAtual: 50, estoqueMinimo: 10 })

    const gestor = await logar('GESTOR')
    const resposta = await gestor.get('/api/reposicao')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toEqual({ grupos: [], totalItens: 0 })
  })

  it('produto inativo nunca aparece, mesmo abaixo do minimo', async () => {
    await criarProduto({ nome: 'Inativo abaixo do minimo', quantidadeAtual: 0, estoqueMinimo: 10, ativo: false })

    const gestor = await logar('GESTOR')
    const resposta = await gestor.get('/api/reposicao')

    expect(resposta.body.dados).toEqual({ grupos: [], totalItens: 0 })
  })

  describe('RN06 — quantidade sugerida', () => {
    it('saldo igual ao minimo fica BAIXO e sugere repor ate o dobro do minimo', async () => {
      await criarProduto({ nome: 'Saldo no minimo', quantidadeAtual: 10, estoqueMinimo: 10 })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/reposicao')

      const item = resposta.body.dados.grupos[0].itens[0]
      expect(item.statusEstoque).toBe('BAIXO')
      expect(item.quantidadeSugerida).toBe(10)
    })

    it('saldo zerado com minimo positivo fica SEM_ESTOQUE e sugere o dobro do minimo', async () => {
      await criarProduto({ nome: 'Saldo zerado', quantidadeAtual: 0, estoqueMinimo: 8 })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/reposicao')

      const item = resposta.body.dados.grupos[0].itens[0]
      expect(item.statusEstoque).toBe('SEM_ESTOQUE')
      expect(item.quantidadeSugerida).toBe(16)
    })

    it('minimo zerado com saldo zerado nunca sugere zero ou negativo', async () => {
      await criarProduto({ nome: 'Sem controle de minimo', quantidadeAtual: 0, estoqueMinimo: 0 })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/reposicao')

      const item = resposta.body.dados.grupos[0].itens[0]
      expect(item.statusEstoque).toBe('SEM_ESTOQUE')
      expect(item.quantidadeSugerida).toBe(1)
    })
  })

  describe('agrupamento por fornecedor', () => {
    it('produto sem fornecedor cai no grupo fornecedor: null, por ultimo na lista (CA13.2/CA13.4)', async () => {
      await criarProduto({ nome: 'Com fornecedor', quantidadeAtual: 2, estoqueMinimo: 10, fornecedorId })
      await criarProduto({ nome: 'Sem fornecedor', quantidadeAtual: 2, estoqueMinimo: 10 })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/reposicao')

      expect(resposta.status).toBe(200)
      const { grupos, totalItens } = resposta.body.dados
      expect(totalItens).toBe(2)
      expect(grupos).toHaveLength(2)
      expect(grupos.at(-1).fornecedor).toBeNull()
      expect(grupos.at(-1).itens.map((i) => i.nome)).toEqual(['Sem fornecedor'])

      const grupoComFornecedor = grupos.find((g) => g.fornecedor !== null)
      expect(grupoComFornecedor.fornecedor).toMatchObject({
        id: fornecedorId,
        nome: 'Distribuidora Pet Sul',
        contatoNome: 'Carlos',
        telefone: '47999998888',
        email: 'vendas@petsul.com.br',
      })
      expect(grupoComFornecedor.totalItens).toBe(1)
    })

    it('filtra por fornecedorId quando informado', async () => {
      const { rows } = await obterPool().query(
        `insert into public.fornecedores (nome) values ('Outro Fornecedor') returning id`,
      )
      const outroFornecedorId = rows[0].id

      await criarProduto({ nome: 'Do fornecedor A', quantidadeAtual: 1, estoqueMinimo: 10, fornecedorId })
      await criarProduto({
        nome: 'Do fornecedor B',
        quantidadeAtual: 1,
        estoqueMinimo: 10,
        fornecedorId: outroFornecedorId,
      })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get(`/api/reposicao?fornecedorId=${fornecedorId}`)

      expect(resposta.body.dados.grupos).toHaveLength(1)
      expect(resposta.body.dados.grupos[0].fornecedor.id).toBe(fornecedorId)
    })

    it('filtra por status quando informado', async () => {
      await criarProduto({ nome: 'Critico', quantidadeAtual: 2, estoqueMinimo: 10 })
      await criarProduto({ nome: 'Sem estoque', quantidadeAtual: 0, estoqueMinimo: 10 })

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/reposicao?status=SEM_ESTOQUE')

      const nomes = resposta.body.dados.grupos.flatMap((g) => g.itens.map((i) => i.nome))
      expect(nomes).toEqual(['Sem estoque'])
    })
  })
})
