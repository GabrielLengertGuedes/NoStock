import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterEnv } from '../../server/config/env.js'
import { obterPool } from '../../server/db/pool.js'
import { limitesDoDiaAtual } from '../../server/shared/horarioLoja.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('GET /api/dashboard', () => {
  let app
  let categoriaId
  let usuarioId
  let hashSenha
  let idPorNome

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logar = async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email: 'dashboard.teste@exemplo.com', senha: SENHA })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Dashboard', 'dashboard.teste@exemplo.com', $1, 'OPERADOR')
       returning id`,
      [hashSenha],
    )
    usuarioId = usuarios[0].id

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Categoria Dashboard') returning id`,
    )
    categoriaId = categorias[0].id

    const criarProduto = async (nome, quantidadeAtual, estoqueMinimo) => {
      const { rows } = await obterPool().query(
        `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
         values ($1, $2, 10.00, $3, $4)
         returning id`,
        [nome, categoriaId, quantidadeAtual, estoqueMinimo],
      )
      return rows[0].id
    }

    idPorNome = {}
    idPorNome['Normal'] = await criarProduto('Produto Normal Dashboard', 20, 10)
    idPorNome['Baixo'] = await criarProduto('Produto Baixo Dashboard', 7, 10)
    idPorNome['Critico'] = await criarProduto('Produto Critico Dashboard', 3, 10)
    idPorNome['SemEstoque'] = await criarProduto('Produto Sem Estoque Dashboard', 0, 5)

    // Limites do dia no fuso da loja: uma movimentacao um minuto depois do
    // inicio conta como "hoje", uma um minuto antes conta como "ontem".
    const { inicio } = limitesDoDiaAtual(obterEnv().fusoHorario)
    const hoje = new Date(inicio.getTime() + 60_000)
    const ontem = new Date(inicio.getTime() - 60_000)

    await obterPool().query(
      `insert into public.movimentacoes
         (produto_id, usuario_id, tipo, motivo, quantidade, saldo_anterior, saldo_posterior, preco_unitario, criado_em)
       values
         ($1, $2, 'ENTRADA', 'COMPRA', 5, 15, 20, 10.00, $3),
         ($1, $2, 'SAIDA',   'VENDA',  2, 20, 18, 10.00, $3),
         ($1, $2, 'ENTRADA', 'COMPRA', 3, 12, 15, 10.00, $4)`,
      [idPorNome['Normal'], usuarioId, hoje.toISOString(), ontem.toISOString()],
    )
  })

  afterEach(desfazerTransacao)

  it('recusa acesso sem sessao', async () => {
    const resposta = await request(app).get('/api/dashboard')

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })

  it('calcula os 4 cards considerando o fuso da loja/cliente', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/dashboard')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.cards).toEqual({
      totalProdutos: 4,
      semEstoque: 1,
      estoqueBaixo: 2,
      entradasHoje: 1,
      saidasHoje: 1,
    })
    expect(typeof resposta.body.dados.atualizadoEm).toBe('string')
    expect(Number.isNaN(Date.parse(resposta.body.dados.atualizadoEm))).toBe(false)
  })

  it('devolve produtosAtencao ordenada por prioridade: SEM_ESTOQUE, CRITICO, BAIXO', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/dashboard')

    expect(resposta.status).toBe(200)
    const nomes = resposta.body.dados.produtosAtencao.map((p) => p.nome)
    expect(nomes).toEqual([
      'Produto Sem Estoque Dashboard',
      'Produto Critico Dashboard',
      'Produto Baixo Dashboard',
    ])
    expect(resposta.body.dados.produtosAtencao.map((p) => p.statusEstoque)).toEqual([
      'SEM_ESTOQUE',
      'CRITICO',
      'BAIXO',
    ])
  })

  it('limita produtosAtencao a 10 itens (CA10.4)', async () => {
    for (let i = 0; i < 12; i += 1) {
      await obterPool().query(
        `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
         values ($1, $2, 10.00, 0, 5)`,
        [`Produto Extra Atencao ${i}`, categoriaId],
      )
    }

    const cliente = await logar()
    const resposta = await cliente.get('/api/dashboard')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.produtosAtencao).toHaveLength(10)
  })
})
