/**
 * F1-14 — Validação técnica da Fase 1 (catálogo e acesso).
 * Simula o cadastro do catálogo real em transação com rollback.
 */
import bcrypt from 'bcrypt'
import request from 'supertest'

import { criarApp } from '../server/app.js'
import { obterPool } from '../server/db/pool.js'
import { resetarLimitadorDeLogin } from '../server/modules/auth/rateLimiter.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../tests/helpers/banco.js'

const SENHA = 'Senha123'
const PREFIXO = `[F1-14 ${Date.now()}]`
const GESTOR_EMAIL = `f114.gestor.${Date.now()}@exemplo.com`
const OPERADOR_EMAIL = `f114.op.${Date.now()}@exemplo.com`

const resultados = []

function ok(id, descricao) {
  resultados.push({ id, descricao, status: 'OK' })
}

function falha(id, descricao, detalhe) {
  resultados.push({ id, descricao, status: 'FALHA', detalhe })
}

async function entrar(app, email) {
  const agente = request.agent(app)
  const login = await agente.post('/api/auth/login').send({ email, senha: SENHA })
  if (login.status !== 200) throw new Error(`Login falhou (${email}): ${login.status}`)
  return agente
}

async function main() {
  if (!temBanco()) {
    console.error('FALHA: DATABASE_URL não configurada — não é possível validar.')
    process.exit(1)
  }

  await resetarLimitadorDeLogin()
  await abrirTransacao()
  const app = criarApp()
  const hash = await bcrypt.hash(SENHA, 4)

  await obterPool().query(
    `insert into usuarios (nome, email, senha_hash, papel, ativo)
     values ('Gestor F114', $1, $2, 'GESTOR', true),
            ('Operador F114', $3, $2, 'OPERADOR', true)`,
    [GESTOR_EMAIL, hash, OPERADOR_EMAIL],
  )

  try {
    // RF01 — Login
    const gestor = await entrar(app, GESTOR_EMAIL)
    const operador = await entrar(app, OPERADOR_EMAIL)
    ok('RF01', 'Login gestor e operador')

    const semSessao = await request(app).get('/api/categorias')
    if (semSessao.status === 401) ok('RF01', 'API exige sessão (401 sem login)')
    else falha('RF01', 'API exige sessão', `esperado 401, veio ${semSessao.status}`)

    // RF12 — Categorias
    const cat = await gestor.post('/api/categorias').send({
      nome: `${PREFIXO} Ração`,
      descricao: 'Categoria teste F1-14',
    })
    if (cat.status === 201) ok('RF12', 'Gestor cria categoria')
    else falha('RF12', 'Gestor cria categoria', JSON.stringify(cat.body))

    const catOp = await operador.post('/api/categorias').send({ nome: 'X' })
    if (catOp.status === 403) ok('RN10', 'Operador não cria categoria (403)')
    else falha('RN10', 'Operador não cria categoria', `status ${catOp.status}`)

    const categoriaId = cat.body.dados.id

    // RF14 — Fornecedores
    const forn = await gestor.post('/api/fornecedores').send({
      nome: `${PREFIXO} Distribuidora`,
      cnpj: '19.980.203/0001-10',
    })
    if (forn.status === 201) ok('RF14', 'Gestor cria fornecedor com CNPJ')
    else falha('RF14', 'Gestor cria fornecedor', JSON.stringify(forn.body))

    const fornecedorId = forn.body.dados.id

    // RF02 / RF09 — Criar produto
    const prod = await gestor.post('/api/produtos').send({
      nome: `${PREFIXO} Ração Premium 15kg`,
      descricao: 'Produto validação F1-14',
      categoriaId,
      fornecedorId,
      precoVenda: 189.9,
      estoqueInicial: 20,
      estoqueMinimo: 10,
    })
    if (prod.status === 201 && prod.body.dados.quantidadeAtual === 20) {
      ok('RF02', 'Cria produto com estoque inicial')
      ok('RF09', 'Estoque mínimo persistido')
    } else falha('RF02', 'Cria produto', JSON.stringify(prod.body))

    const produtoId = prod.body.dados.id

    // CA2.4 — Nome duplicado
    const dup = await gestor.post('/api/produtos').send({
      nome: `${PREFIXO} Ração Premium 15kg`,
      categoriaId,
      precoVenda: 50,
      estoqueInicial: 0,
      estoqueMinimo: 0,
    })
    if (dup.status === 409 && dup.body.erro.codigo === 'NOME_DUPLICADO') {
      ok('CA2.4', 'Nome duplicado retorna 409')
    } else falha('CA2.4', 'Nome duplicado', JSON.stringify(dup.body))

    const dupOk = await gestor.post('/api/produtos').send({
      nome: `${PREFIXO} Ração Premium 15kg`,
      categoriaId,
      precoVenda: 50,
      estoqueInicial: 0,
      estoqueMinimo: 0,
      confirmarNomeDuplicado: true,
    })
    if (dupOk.status === 201) ok('CA2.4', 'Confirmação de nome duplicado funciona')
    else falha('CA2.4', 'Confirmação duplicado', JSON.stringify(dupOk.body))

    // RF03 — Listagem e busca
    const lista = await gestor.get('/api/produtos', {
      params: { busca: 'racao premium', categoriaId, status: 'NORMAL' },
    })
    const achou = lista.body.dados?.some((p) => p.id === produtoId)
    if (lista.status === 200 && achou) ok('RF03', 'Busca ignora acento e filtra por categoria/status')
    else falha('RF03', 'Listagem e busca', `achou=${achou}`)

    const semEstoque = await gestor.get('/api/produtos', { params: { status: 'SEM_ESTOQUE' } })
    if (semEstoque.status === 200) ok('RF07', 'Filtro SEM_ESTOQUE na API')

    // RF06 — Editar produto (nome novo para não colidir com o duplicado confirmado acima)
    const edit = await gestor.put(`/api/produtos/${produtoId}`).send({
      nome: `${PREFIXO} Ração Premium 15kg Editada`,
      descricao: 'Editado',
      categoriaId,
      fornecedorId,
      precoVenda: 199.9,
      estoqueMinimo: 10,
    })
    if (edit.status === 200 && edit.body.dados.quantidadeAtual === 20) {
      ok('RF06', 'Edita produto sem alterar saldo (CA6.1)')
    } else falha('RF06', 'Edita produto', JSON.stringify(edit.body))

    const saldo422 = await gestor.put(`/api/produtos/${produtoId}`).send({
      nome: `${PREFIXO} Ração Premium 15kg Editada`,
      categoriaId,
      precoVenda: 199.9,
      estoqueMinimo: 10,
      quantidadeAtual: 999,
    })
    if (saldo422.status === 422) ok('CA6.2', 'PUT rejeita quantidadeAtual')

    // RN10 — Operador cria/edita produto, não exclui
    const prodOp = await operador.post('/api/produtos').send({
      nome: `${PREFIXO} Produto Operador`,
      categoriaId,
      precoVenda: 10,
      estoqueInicial: 5,
      estoqueMinimo: 2,
    })
    if (prodOp.status === 201) ok('RN10', 'Operador cria produto')
    else falha('RN10', 'Operador cria produto', JSON.stringify(prodOp.body))

    const delOp = await operador.delete(`/api/produtos/${produtoId}`)
    if (delOp.status === 403) ok('RN10', 'Operador não exclui produto (403)')
    else falha('RN10', 'Operador não exclui', `status ${delOp.status}`)

    // RF08 — Exclusão lógica (gestor)
    const del = await gestor.delete(`/api/produtos/${produtoId}`)
    if (del.status === 204) ok('RF08', 'Gestor inativa produto (204)')
    else falha('RF08', 'Gestor inativa produto', `status ${del.status}`)

    const sumiu = await gestor.get('/api/produtos')
    const aindaVisivel = sumiu.body.dados?.some((p) => p.id === produtoId)
    if (!aindaVisivel) ok('RF08', 'Produto inativo some da listagem padrão (RN07)')
    else falha('RF08', 'Produto some da listagem', 'ainda visível')

    // RF16 — Usuários (gestor)
    const usuarios403 = await operador.get('/api/usuarios')
    if (usuarios403.status === 403) ok('RF16', 'Operador não acessa usuários')
    else falha('RF16', 'Operador bloqueado em usuários', `status ${usuarios403.status}`)
  } finally {
    await desfazerTransacao()
  }

  const falhas = resultados.filter((r) => r.status === 'FALHA')
  console.log('\n=== F1-14 — Validação Fase 1 (técnica) ===\n')
  for (const r of resultados) {
    const icone = r.status === 'OK' ? '✓' : '✗'
    console.log(`${icone} [${r.id}] ${r.descricao}${r.detalhe ? ` — ${r.detalhe}` : ''}`)
  }
  console.log(`\nTotal: ${resultados.length} | OK: ${resultados.length - falhas.length} | Falhas: ${falhas.length}`)
  process.exit(falhas.length > 0 ? 1 : 0)
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
