import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

// Bem maior que qualquer janela usada nos testes: cobre "agora" sem precisar
// calcular limites de dia, algo que este relatorio nem depende do fuso.
const PERIODO_AMPLO = '?de=2000-01-01T00:00:00Z&ate=2100-01-01T00:00:00Z'
const PERIODO_SEM_MOVIMENTACAO = '?de=1999-01-01T00:00:00Z&ate=1999-12-31T23:59:59Z'

describe.skipIf(!temBanco())('/api/relatorios', () => {
  let app
  let categoriaRacaoId
  let categoriaHigieneId
  let produtoRacaoId
  let produtoHigieneId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logar = async (papel) => {
    const email = papel === 'GESTOR' ? 'relatorios.gestor@exemplo.com' : 'relatorios.operador@exemplo.com'
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email, senha: SENHA })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Relatorios', 'relatorios.operador@exemplo.com', $1, 'OPERADOR'),
              ('Gestor Relatorios', 'relatorios.gestor@exemplo.com', $1, 'GESTOR')`,
      [hashSenha],
    )

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Ração Relatórios'), ('Higiene Relatórios')
       returning id, nome`,
    )
    categoriaRacaoId = categorias.find((c) => c.nome === 'Ração Relatórios').id
    categoriaHigieneId = categorias.find((c) => c.nome === 'Higiene Relatórios').id

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Ração Relatório', $1, 50.00, 100, 0),
              ('Shampoo Relatório', $2, 30.00, 100, 0)
       returning id, nome`,
      [categoriaRacaoId, categoriaHigieneId],
    )
    produtoRacaoId = produtos.find((p) => p.nome === 'Ração Relatório').id
    produtoHigieneId = produtos.find((p) => p.nome === 'Shampoo Relatório').id
  })

  afterEach(desfazerTransacao)

  const venderViaApi = (cliente, produtoId, quantidade) =>
    cliente.post('/api/movimentacoes').send({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade,
    })

  describe('GET /resumo', () => {
    it('recusa acesso de operador com 403', async () => {
      const cliente = await logar('OPERADOR')

      const resposta = await cliente.get(`/api/relatorios/resumo${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    })

    it('recusa acesso sem sessao com 401', async () => {
      const resposta = await request(app).get(`/api/relatorios/resumo${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(401)
      expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
    })

    it('exige de e ate com 422', async () => {
      const cliente = await logar('GESTOR')

      const resposta = await cliente.get('/api/relatorios/resumo')

      expect(resposta.status).toBe(422)
      expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    })

    it('periodo sem movimentacoes devolve totalVendido e unidadesVendidas zerados', async () => {
      const cliente = await logar('GESTOR')
      await venderViaApi(cliente, produtoRacaoId, 3)

      const resposta = await cliente.get(`/api/relatorios/resumo${PERIODO_SEM_MOVIMENTACAO}`)

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.totalVendido).toBe(0)
      expect(resposta.body.dados.unidadesVendidas).toBe(0)
    })

    it('usa o preco_unitario da venda (RN09): reajuste posterior no produto nao altera o total historico', async () => {
      const gestor = await logar('GESTOR')

      await venderViaApi(gestor, produtoRacaoId, 3) // 3 x 50.00 = 150.00

      await gestor.put(`/api/produtos/${produtoRacaoId}`).send({
        nome: 'Ração Relatório',
        categoriaId: categoriaRacaoId,
        fornecedorId: null,
        precoVenda: 999.99,
        estoqueMinimo: 0,
      })

      const resposta = await gestor.get(`/api/relatorios/resumo${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.totalVendido).toBe(150)
      expect(resposta.body.dados.unidadesVendidas).toBe(3)
    })

    it('soma varias vendas e ignora entrada, ajuste e saida por outro motivo', async () => {
      const gestor = await logar('GESTOR')

      await venderViaApi(gestor, produtoRacaoId, 2) // 2 x 50.00 = 100.00
      await venderViaApi(gestor, produtoHigieneId, 4) // 4 x 30.00 = 120.00
      await gestor.post('/api/movimentacoes').send({
        produtoId: produtoRacaoId,
        tipo: 'ENTRADA',
        motivo: 'COMPRA',
        quantidade: 10,
      })
      await gestor.post('/api/movimentacoes').send({
        produtoId: produtoHigieneId,
        tipo: 'SAIDA',
        motivo: 'DESCARTE',
        quantidade: 1,
      })

      const resposta = await gestor.get(`/api/relatorios/resumo${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.totalVendido).toBe(220)
      expect(resposta.body.dados.unidadesVendidas).toBe(6)
    })
  })

  describe('GET /ranking?agrupar=categoria', () => {
    it('recusa acesso de operador com 403', async () => {
      const cliente = await logar('OPERADOR')

      const resposta = await cliente.get(`/api/relatorios/ranking${PERIODO_AMPLO}&agrupar=categoria`)

      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    })

    it('recusa agrupar diferente de categoria com 422', async () => {
      const cliente = await logar('GESTOR')

      const resposta = await cliente.get(`/api/relatorios/ranking${PERIODO_AMPLO}&agrupar=produto`)

      expect(resposta.status).toBe(422)
      expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    })

    it('periodo sem movimentacoes devolve lista de categorias vazia', async () => {
      const cliente = await logar('GESTOR')
      await venderViaApi(cliente, produtoRacaoId, 3)

      const resposta = await cliente.get(
        `/api/relatorios/ranking${PERIODO_SEM_MOVIMENTACAO}&agrupar=categoria`,
      )

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.categorias).toEqual([])
    })

    it('agrupa por categoria e usa preco_unitario historico na receita (RN09)', async () => {
      const gestor = await logar('GESTOR')

      await venderViaApi(gestor, produtoRacaoId, 3) // Ração: 3 x 50.00 = 150.00
      await venderViaApi(gestor, produtoHigieneId, 4) // Higiene: 4 x 30.00 = 120.00

      await gestor.put(`/api/produtos/${produtoRacaoId}`).send({
        nome: 'Ração Relatório',
        categoriaId: categoriaRacaoId,
        fornecedorId: null,
        precoVenda: 999.99,
        estoqueMinimo: 0,
      })

      const resposta = await gestor.get(`/api/relatorios/ranking${PERIODO_AMPLO}&agrupar=categoria`)

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.categorias).toHaveLength(2)

      const racao = resposta.body.dados.categorias.find((c) => c.categoria.id === categoriaRacaoId)
      expect(racao.produtos).toEqual([
        { id: produtoRacaoId, nome: 'Ração Relatório', unidades: 3, receita: 150 },
      ])

      const higiene = resposta.body.dados.categorias.find((c) => c.categoria.id === categoriaHigieneId)
      expect(higiene.produtos).toEqual([
        { id: produtoHigieneId, nome: 'Shampoo Relatório', unidades: 4, receita: 120 },
      ])
    })

    it('filtra por categoriaId quando informado', async () => {
      const gestor = await logar('GESTOR')

      await venderViaApi(gestor, produtoRacaoId, 3)
      await venderViaApi(gestor, produtoHigieneId, 4)

      const resposta = await gestor.get(
        `/api/relatorios/ranking${PERIODO_AMPLO}&agrupar=categoria&categoriaId=${categoriaRacaoId}`,
      )

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.categorias.map((c) => c.categoria.id)).toEqual([categoriaRacaoId])
    })
  })

  describe('GET /categorias', () => {
    it('recusa acesso de operador com 403', async () => {
      const cliente = await logar('OPERADOR')

      const resposta = await cliente.get('/api/relatorios/categorias')

      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    })

    it('recusa acesso sem sessao com 401', async () => {
      const resposta = await request(app).get('/api/relatorios/categorias')

      expect(resposta.status).toBe(401)
      expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
    })

    it('consolida unidades e valor imobilizado por categoria', async () => {
      // categoria sem nenhum produto ativo: deve aparecer zerada, nao sumir.
      const { rows: vaziaRows } = await obterPool().query(
        `insert into public.categorias (nome) values ('Categoria Vazia Relatórios') returning id`,
      )
      const categoriaVaziaId = vaziaRows[0].id

      // produto inativo nao pode contar nos agregados da sua categoria.
      await obterPool().query(
        `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo, ativo)
         values ('Ração Inativa Relatório', $1, 100.00, 50, 0, false)`,
        [categoriaRacaoId],
      )

      const gestor = await logar('GESTOR')
      const resposta = await gestor.get('/api/relatorios/categorias')

      expect(resposta.status).toBe(200)
      const porId = Object.fromEntries(resposta.body.dados.categorias.map((c) => [c.id, c]))

      expect(porId[categoriaRacaoId]).toMatchObject({
        nome: 'Ração Relatórios',
        produtos: 1,
        unidades: 100,
        valorImobilizado: 5000,
      })
      expect(porId[categoriaHigieneId]).toMatchObject({
        nome: 'Higiene Relatórios',
        produtos: 1,
        unidades: 100,
        valorImobilizado: 3000,
      })
      expect(porId[categoriaVaziaId]).toMatchObject({
        nome: 'Categoria Vazia Relatórios',
        produtos: 0,
        unidades: 0,
        valorImobilizado: 0,
      })
    })
  })

  describe('GET /giro', () => {
    it('recusa acesso de operador com 403', async () => {
      const cliente = await logar('OPERADOR')

      const resposta = await cliente.get(`/api/relatorios/giro${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(403)
      expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO')
    })

    it('exige de e ate com 422', async () => {
      const cliente = await logar('GESTOR')

      const resposta = await cliente.get('/api/relatorios/giro')

      expect(resposta.status).toBe(422)
      expect(resposta.body.erro.codigo).toBe('VALIDACAO')
    })

    it('traz a formula do calculo, para a interface explicar o numero', async () => {
      const cliente = await logar('GESTOR')

      const resposta = await cliente.get(`/api/relatorios/giro${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(200)
      expect(typeof resposta.body.dados.formula).toBe('string')
      expect(resposta.body.dados.formula.length).toBeGreaterThan(0)
    })

    it('calcula o giro por produto (vendidas no periodo / estoque atual) e o geral', async () => {
      const gestor = await logar('GESTOR')
      await venderViaApi(gestor, produtoRacaoId, 20) // saldo cai de 100 para 80

      const resposta = await gestor.get(`/api/relatorios/giro${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(200)
      const racao = resposta.body.dados.produtos.find((p) => p.id === produtoRacaoId)
      expect(racao).toMatchObject({ unidadesVendidas: 20, quantidadeAtual: 80, giro: 0.25 })

      const higiene = resposta.body.dados.produtos.find((p) => p.id === produtoHigieneId)
      expect(higiene).toMatchObject({ unidadesVendidas: 0, quantidadeAtual: 100, giro: 0 })

      expect(resposta.body.dados.geral).toMatchObject({
        unidadesVendidas: 20,
        quantidadeEmEstoque: 180,
        giro: 0.11,
      })
    })

    it('devolve giro nulo para produto sem estoque, em vez de dividir por zero', async () => {
      const { rows } = await obterPool().query(
        `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
         values ('Produto Zerado Relatório', $1, 10.00, 0, 0)
         returning id`,
        [categoriaRacaoId],
      )
      const produtoZeradoId = rows[0].id

      const cliente = await logar('GESTOR')
      const resposta = await cliente.get(`/api/relatorios/giro${PERIODO_AMPLO}`)

      expect(resposta.status).toBe(200)
      const zerado = resposta.body.dados.produtos.find((p) => p.id === produtoZeradoId)
      expect(zerado.giro).toBeNull()
    })

    it('filtra por categoriaId quando informado', async () => {
      const cliente = await logar('GESTOR')

      const resposta = await cliente.get(`/api/relatorios/giro${PERIODO_AMPLO}&categoriaId=${categoriaRacaoId}`)

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados.produtos.map((p) => p.id)).toEqual([produtoRacaoId])
    })
  })
})
