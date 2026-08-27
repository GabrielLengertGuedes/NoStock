import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

const SENHA = 'Senha123'

describe.skipIf(!temBanco())('/api/produtos', () => {
  let app
  let categoriaRacao
  let categoriaHigiene
  let fornecedorX
  let fornecedorY
  let idPorNome
  let usuarioId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
  })

  const criarCategoria = async (nome) => {
    const { rows } = await obterPool().query(
      `insert into public.categorias (nome) values ($1) returning id`,
      [nome],
    )
    return rows[0].id
  }

  const criarFornecedor = async (nome) => {
    const { rows } = await obterPool().query(
      `insert into public.fornecedores (nome) values ($1) returning id`,
      [nome],
    )
    return rows[0].id
  }

  const criarProduto = async ({ nome, categoriaId, fornecedorId, quantidadeAtual, estoqueMinimo }) => {
    const { rows } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual, estoque_minimo)
       values ($1, $2, $3, 10.00, $4, $5)
       returning id`,
      [nome, categoriaId, fornecedorId, quantidadeAtual, estoqueMinimo],
    )
    return rows[0].id
  }

  const logar = async () => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email: 'produtos.teste@exemplo.com', senha: SENHA })
    return cliente
  }

  beforeEach(async () => {
    await abrirTransacao()
    app = criarApp()

    const { rows } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Teste', 'produtos.teste@exemplo.com', $1, 'OPERADOR')
       returning id`,
      [hashSenha],
    )
    usuarioId = rows[0].id

    categoriaRacao = await criarCategoria('Ração Teste')
    categoriaHigiene = await criarCategoria('Higiene Teste')
    fornecedorX = await criarFornecedor('Fornecedor X')
    fornecedorY = await criarFornecedor('Fornecedor Y')

    // saldo/minimo escolhidos para cobrir os quatro status de shared/statusEstoque.js:
    // NORMAL, BAIXO, CRITICO e SEM_ESTOQUE.
    idPorNome = {}
    idPorNome['Ração Premium Cães Adultos'] = await criarProduto({
      nome: 'Ração Premium Cães Adultos',
      categoriaId: categoriaRacao,
      fornecedorId: fornecedorX,
      quantidadeAtual: 20,
      estoqueMinimo: 10, // NORMAL
    })
    idPorNome['Ração Filhote Sabor Frango'] = await criarProduto({
      nome: 'Ração Filhote Sabor Frango',
      categoriaId: categoriaRacao,
      fornecedorId: fornecedorX,
      quantidadeAtual: 7,
      estoqueMinimo: 10, // BAIXO
    })
    idPorNome['Areia Sanitária Perfumada'] = await criarProduto({
      nome: 'Areia Sanitária Perfumada',
      categoriaId: categoriaHigiene,
      fornecedorId: fornecedorY,
      quantidadeAtual: 0,
      estoqueMinimo: 5, // SEM_ESTOQUE
    })
    idPorNome['Shampoo Neutro Pet'] = await criarProduto({
      nome: 'Shampoo Neutro Pet',
      categoriaId: categoriaHigiene,
      fornecedorId: fornecedorY,
      quantidadeAtual: 3,
      estoqueMinimo: 10, // CRITICO
    })
    idPorNome['Brinquedo Corda Resistente'] = await criarProduto({
      nome: 'Brinquedo Corda Resistente',
      categoriaId: categoriaHigiene,
      fornecedorId: null,
      quantidadeAtual: 50,
      estoqueMinimo: 0, // NORMAL, sem fornecedor
    })
  })

  afterEach(desfazerTransacao)

  const listar = (query = '') => request(app).get(`/api/produtos${query}`)

  it('acha o mesmo produto buscando sem acento, em qualquer caixa', async () => {
    for (const termo of ['racao', 'Ração', 'RAÇÃO', 'RACAO']) {
      const resposta = await listar(`?busca=${encodeURIComponent(termo)}`)

      expect(resposta.status).toBe(200)
      const nomes = resposta.body.dados.map((p) => p.nome)
      expect(nomes).toContain('Ração Premium Cães Adultos')
      expect(nomes).toContain('Ração Filhote Sabor Frango')
      expect(resposta.body.dados).toHaveLength(2)
    }
  })

  it('busca por trecho do nome, não só do começo', async () => {
    const resposta = await listar('?busca=frango')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.map((p) => p.nome)).toEqual(['Ração Filhote Sabor Frango'])
  })

  it('filtra por categoria', async () => {
    const resposta = await listar(`?categoriaId=${categoriaRacao}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(2)
    expect(resposta.body.dados.every((p) => p.categoria.id === categoriaRacao)).toBe(true)
  })

  it('filtra por fornecedor e traz null para produto sem fornecedor', async () => {
    const resposta = await listar(`?fornecedorId=${fornecedorY}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados).toHaveLength(2)
    expect(resposta.body.dados.every((p) => p.fornecedor.id === fornecedorY)).toBe(true)

    const todos = await listar()
    const brinquedo = todos.body.dados.find((p) => p.nome === 'Brinquedo Corda Resistente')
    expect(brinquedo.fornecedor).toBeNull()
  })

  it('calcula o statusEstoque no servidor para os quatro estados', async () => {
    const resposta = await listar()
    const porNome = Object.fromEntries(resposta.body.dados.map((p) => [p.nome, p.statusEstoque]))

    expect(porNome['Ração Premium Cães Adultos']).toBe('NORMAL')
    expect(porNome['Ração Filhote Sabor Frango']).toBe('BAIXO')
    expect(porNome['Areia Sanitária Perfumada']).toBe('SEM_ESTOQUE')
    expect(porNome['Shampoo Neutro Pet']).toBe('CRITICO')
    expect(porNome['Brinquedo Corda Resistente']).toBe('NORMAL')
  })

  it('filtra pelo status dedicado SEM_ESTOQUE', async () => {
    const resposta = await listar('?status=SEM_ESTOQUE')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.map((p) => p.nome)).toEqual(['Areia Sanitária Perfumada'])
  })

  it('filtra pelo agregado PRECISA_REPOR (BAIXO + CRITICO + SEM_ESTOQUE)', async () => {
    const resposta = await listar('?status=PRECISA_REPOR')

    expect(resposta.status).toBe(200)
    expect(resposta.body.dados.map((p) => p.nome).sort()).toEqual(
      ['Areia Sanitária Perfumada', 'Ração Filhote Sabor Frango', 'Shampoo Neutro Pet'].sort(),
    )
  })

  it('pagina os resultados e devolve o total real em meta', async () => {
    const primeiraPagina = await listar('?porPagina=2&pagina=1')
    expect(primeiraPagina.status).toBe(200)
    expect(primeiraPagina.body.dados).toHaveLength(2)
    expect(primeiraPagina.body.meta).toEqual({
      pagina: 1,
      porPagina: 2,
      total: 5,
      totalPaginas: 3,
    })

    const ultimaPagina = await listar('?porPagina=2&pagina=3')
    expect(ultimaPagina.body.dados).toHaveLength(1)

    const nomesVistos = [...primeiraPagina.body.dados, ...ultimaPagina.body.dados].map((p) => p.nome)
    expect(new Set(nomesVistos).size).toBe(3)
  })

  it('esconde produto inativo por padrão e mostra com ativo=false ou ativo=todos', async () => {
    await obterPool().query('update public.produtos set ativo = false where id = $1', [
      idPorNome['Shampoo Neutro Pet'],
    ])

    const padrao = await listar()
    expect(padrao.body.dados.map((p) => p.nome)).not.toContain('Shampoo Neutro Pet')

    const soInativos = await listar('?ativo=false')
    expect(soInativos.body.dados.map((p) => p.nome)).toEqual(['Shampoo Neutro Pet'])

    const todos = await listar('?ativo=todos')
    expect(todos.body.dados).toHaveLength(5)
  })

  it('ordena por quantidade em ordem decrescente', async () => {
    const resposta = await listar('?ordenarPor=quantidade&ordem=desc')

    const quantidades = resposta.body.dados.map((p) => p.quantidadeAtual)
    expect(quantidades).toEqual([...quantidades].sort((a, b) => b - a))
  })

  it('recusa porPagina acima de 100 com 422', async () => {
    const resposta = await listar('?porPagina=101')

    expect(resposta.status).toBe(422)
    expect(resposta.body.erro.codigo).toBe('VALIDACAO')
  })

  const criarViaApi = (cliente, corpo) => cliente.post('/api/produtos').send(corpo)

  it('cria produto sem estoque inicial e nao gera movimentacao', async () => {
    const cliente = await logar()

    const resposta = await criarViaApi(cliente, {
      nome: 'Coleira Ajustável G',
      categoriaId: categoriaHigiene,
      fornecedorId: fornecedorY,
      precoVenda: 39.9,
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados).toMatchObject({
      nome: 'Coleira Ajustável G',
      categoria: { id: categoriaHigiene, nome: 'Higiene Teste' },
      fornecedor: { id: fornecedorY, nome: 'Fornecedor Y' },
      precoVenda: 39.9,
      quantidadeAtual: 0,
      estoqueMinimo: 0,
      statusEstoque: 'SEM_ESTOQUE',
      ativo: true,
    })

    const { rows } = await obterPool().query(
      'select count(*)::int as n from public.movimentacoes where produto_id = $1',
      [resposta.body.dados.id],
    )
    expect(rows[0].n).toBe(0)
  })

  it('cria produto com estoque inicial e gera a movimentacao ENTRADA/ESTOQUE_INICIAL com o usuario da sessao', async () => {
    const cliente = await logar()

    const resposta = await criarViaApi(cliente, {
      nome: 'Ração Adulto Sabor Carne',
      categoriaId: categoriaRacao,
      precoVenda: 120,
      estoqueInicial: 15,
      estoqueMinimo: 5,
    })

    expect(resposta.status).toBe(201)
    expect(resposta.body.dados.quantidadeAtual).toBe(15)
    expect(resposta.body.dados.fornecedor).toBeNull()

    const { rows } = await obterPool().query(
      `select produto_id, usuario_id, tipo, motivo, quantidade,
              saldo_anterior, saldo_posterior, preco_unitario::float8 as preco_unitario
         from public.movimentacoes where produto_id = $1`,
      [resposta.body.dados.id],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      usuario_id: usuarioId,
      tipo: 'ENTRADA',
      motivo: 'ESTOQUE_INICIAL',
      quantidade: 15,
      saldo_anterior: 0,
      saldo_posterior: 15,
      preco_unitario: 120,
    })
  })

  it('recusa nome duplicado de produto ativo com 409 NOME_DUPLICADO', async () => {
    const cliente = await logar()
    const corpo = {
      nome: 'Ração Premium Cães Adultos', // ja existe, criado no beforeEach
      categoriaId: categoriaRacao,
      precoVenda: 50,
    }

    const resposta = await criarViaApi(cliente, corpo)

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro.codigo).toBe('NOME_DUPLICADO')
    expect(resposta.body.erro.campos.nome).toBeDefined()
  })

  it('permite nome duplicado quando confirmarNomeDuplicado e true', async () => {
    const cliente = await logar()

    const resposta = await criarViaApi(cliente, {
      nome: 'Ração Premium Cães Adultos',
      categoriaId: categoriaRacao,
      precoVenda: 50,
      confirmarNomeDuplicado: true,
    })

    expect(resposta.status).toBe(201)
  })

  it('nao exige confirmacao quando o produto de mesmo nome esta inativo', async () => {
    await obterPool().query('update public.produtos set ativo = false where id = $1', [
      idPorNome['Ração Premium Cães Adultos'],
    ])
    const cliente = await logar()

    const resposta = await criarViaApi(cliente, {
      nome: 'Ração Premium Cães Adultos',
      categoriaId: categoriaRacao,
      precoVenda: 50,
    })

    expect(resposta.status).toBe(201)
  })

  it('recusa campo obrigatorio vazio ou numero negativo com 422', async () => {
    const cliente = await logar()
    const base = { nome: 'Produto Válido', categoriaId: categoriaRacao, precoVenda: 10 }

    const semNome = await criarViaApi(cliente, { ...base, nome: '' })
    expect(semNome.status).toBe(422)
    expect(semNome.body.erro.campos.nome).toBeDefined()

    const precoNegativo = await criarViaApi(cliente, { ...base, precoVenda: -1 })
    expect(precoNegativo.status).toBe(422)
    expect(precoNegativo.body.erro.campos.precoVenda).toBeDefined()

    const estoqueNegativo = await criarViaApi(cliente, { ...base, estoqueInicial: -5 })
    expect(estoqueNegativo.status).toBe(422)
    expect(estoqueNegativo.body.erro.campos.estoqueInicial).toBeDefined()
  })

  it('recusa criar produto sem sessao com 401', async () => {
    const resposta = await request(app).post('/api/produtos').send({
      nome: 'Sem Sessão',
      categoriaId: categoriaRacao,
      precoVenda: 10,
    })

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO')
  })
})
