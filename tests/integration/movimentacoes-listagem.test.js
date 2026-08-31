import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('GET /api/movimentacoes e /api/produtos/:id/movimentacoes', () => {
  let app
  let produtoAtivoId
  let produtoInativoId
  let operadorId
  let gestorId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const logar = async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({
      email: 'listagem.operador@exemplo.com',
      senha: SENHA,
    })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Listagem', 'listagem.operador@exemplo.com', $1, 'OPERADOR'),
              ('Gestor Listagem', 'listagem.gestor@exemplo.com', $1, 'GESTOR')
       returning id, papel`,
      [hashSenha],
    )
    operadorId = usuarios.find((u) => u.papel === 'OPERADOR').id
    gestorId = usuarios.find((u) => u.papel === 'GESTOR').id

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('Listagem Mov') returning id`,
    )
    const categoriaId = categorias[0].id

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo, ativo)
       values ('Produto Ativo Listagem', $1, 10.00, 5, 3, true),
              ('Produto Inativo Listagem', $1, 20.00, 2, 1, false)
       returning id, ativo`,
      [categoriaId],
    )
    produtoAtivoId = produtos.find((p) => p.ativo).id
    produtoInativoId = produtos.find((p) => !p.ativo).id

    await obterPool().query(
      `insert into public.movimentacoes
         (produto_id, usuario_id, tipo, motivo, quantidade, saldo_anterior, saldo_posterior, preco_unitario, criado_em)
       values
         ($1, $2, 'ENTRADA', 'COMPRA', 5, 0, 5, 10.00, '2026-08-01T10:00:00-03:00'),
         ($1, $3, 'SAIDA', 'VENDA', 2, 5, 3, 10.00, '2026-08-02T14:00:00-03:00'),
         ($4, $2, 'ENTRADA', 'ESTOQUE_INICIAL', 2, 0, 2, 20.00, '2026-08-03T09:00:00-03:00')`,
      [produtoAtivoId, operadorId, gestorId, produtoInativoId],
    )
  })

  afterEach(desfazerTransacao)

  it('lista movimentacoes da mais recente para a mais antiga (CA11.1)', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/movimentacoes')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(3)
    expect(resposta.body.dados[0].tipo).toBe('ENTRADA')
    expect(resposta.body.dados[0].produto.nome).toBe('Produto Inativo Listagem')
    expect(resposta.body.dados[2].tipo).toBe('ENTRADA')
    expect(resposta.body.dados[2].produto.nome).toBe('Produto Ativo Listagem')
    expect(resposta.body.meta).toMatchObject({ pagina: 1, porPagina: 20, total: 3, totalPaginas: 1 })
  })

  it('filtra por produto, tipo, funcionario e periodo (CA11.2)', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/movimentacoes').query({
      produtoId: produtoAtivoId,
      tipo: 'SAIDA',
      usuarioId: gestorId,
      de: '2026-08-02T00:00:00-03:00',
      ate: '2026-08-02T23:59:59-03:00',
    })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(1)
    expect(resposta.body.dados[0]).toMatchObject({
      produtoId: produtoAtivoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      usuario: { id: gestorId, nome: 'Gestor Listagem' },
    })
  })

  it('inclui movimentacoes de produto inativado (CA11.6)', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/movimentacoes').query({
      produtoId: produtoInativoId,
    })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(1)
    expect(resposta.body.dados[0].produto.nome).toBe('Produto Inativo Listagem')
  })

  it('pagina resultados', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/movimentacoes').query({ pagina: 2, porPagina: 1 })

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(1)
    expect(resposta.body.meta).toMatchObject({ pagina: 2, porPagina: 1, total: 3, totalPaginas: 3 })
  })

  it('lista movimentacoes por produto em /api/produtos/:id/movimentacoes', async () => {
    const cliente = await logar()

    const resposta = await cliente.get(`/api/produtos/${produtoAtivoId}/movimentacoes`)

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(2)
    expect(resposta.body.dados.every((m) => m.produtoId === produtoAtivoId)).toBe(true)
    expect(resposta.body.dados[0].usuario.nome).toBeTruthy()
  })

  it('retorna 404 para produto inexistente em /api/produtos/:id/movimentacoes', async () => {
    const cliente = await logar()

    const resposta = await cliente.get('/api/produtos/99999/movimentacoes')

    expect(resposta.status).toBe(404)
    expect(resposta.body.erro.codigo).toBe('NAO_ENCONTRADO')
  })

  it('retorna 401 sem sessao', async () => {
    const resposta = await request(app).get('/api/movimentacoes')

    expect(resposta.status).toBe(401)
  })
})
