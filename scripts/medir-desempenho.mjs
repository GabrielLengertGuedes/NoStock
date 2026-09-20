/**
 * F3-06 — Medição única de desempenho das funcionalidades principais.
 *
 * Roda uma única vez, numa única sessão autenticada e numa única transação
 * (desfeita ao final — nada fica gravado no banco), sobre o mesmo seed:
 *   - busca de produtos numa base de 500 itens             (< 2 s)
 *   - consulta de histórico de movimentações de ~3 meses   (< 3 s)
 *   - carregamento completo do Dashboard                   (< 3 s)
 *
 * Uso: node scripts/medir-desempenho.mjs (precisa de DATABASE_URL no .env).
 */
import bcrypt from 'bcrypt'
import request from 'supertest'
import { performance } from 'node:perf_hooks'

import { criarApp } from '../server/app.js'
import { obterPool } from '../server/db/pool.js'
import { resetarLimitadorDeLogin } from '../server/modules/auth/rateLimiter.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../tests/helpers/banco.js'

const SENHA = 'Senha123'
const PREFIXO = `perf.${Date.now()}`
const GESTOR_EMAIL = `${PREFIXO}.gestor@exemplo.com`

const TOTAL_PRODUTOS = 500
const TOTAL_CATEGORIAS = 5
const TOTAL_MOVIMENTACOES = 6000
const DIAS_DE_HISTORICO = 90 // ~3 meses

const LIMITE_BUSCA_MS = 2000
const LIMITE_HISTORICO_MS = 3000
const LIMITE_DASHBOARD_MS = 3000

const resultados = []

function registrar(id, descricao, ms, limiteMs) {
  resultados.push({ id, descricao, ms, limiteMs, status: ms < limiteMs ? 'OK' : 'FALHA' })
}

async function medir(fn) {
  const inicio = performance.now()
  const saida = await fn()
  return { ms: performance.now() - inicio, saida }
}

// As 3 consultas seguintes semeiam tudo em SQL (generate_series), num unico
// round-trip cada: 500 produtos + 6000 movimentacoes via JS levariam minutos
// so pra montar a massa, o que mediria o seed, nao a funcionalidade.
async function semearCategorias() {
  const { rows } = await obterPool().query(
    `insert into public.categorias (nome)
     select $1 || ' ' || n from generate_series(1, $2) as n
     returning id`,
    [`${PREFIXO} Categoria`, TOTAL_CATEGORIAS],
  )
  return rows.map((linha) => linha.id)
}

// A cada 5 produtos, um leva "Ração" no nome: da ~100 resultados pra busca
// medida abaixo, um retorno nem trivial (poucos) nem irreal (a base inteira).
async function semearProdutos(categoriaIds) {
  const { rows } = await obterPool().query(
    `insert into public.produtos (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
     select
       case when n % 5 = 0 then $1 || ' Ração Perf ' || n else $1 || ' Produto Perf ' || n end,
       ($2::int[])[1 + (n % $3)],
       (10 + (n % 200))::numeric(10,2),
       (n % 50),
       10
     from generate_series(1, $4) as n
     returning id`,
    [PREFIXO, categoriaIds, categoriaIds.length, TOTAL_PRODUTOS],
  )
  return rows.map((linha) => linha.id)
}

async function semearMovimentacoes(produtoIds, usuarioId) {
  await obterPool().query(
    `insert into public.movimentacoes
       (produto_id, usuario_id, tipo, motivo, quantidade, saldo_anterior, saldo_posterior, preco_unitario, criado_em)
     select
       ($1::int[])[1 + (n % array_length($1::int[], 1))],
       $2,
       case when n % 2 = 0 then 'ENTRADA'::public.tipo_movimentacao else 'SAIDA'::public.tipo_movimentacao end,
       case when n % 2 = 0 then 'COMPRA'::public.motivo_movimentacao else 'VENDA'::public.motivo_movimentacao end,
       1 + (n % 10),
       20,
       25,
       (10 + (n % 200))::numeric(10,2),
       now() - ((n % $3) || ' days')::interval - ((n % 1440) || ' minutes')::interval
     from generate_series(1, $4) as n`,
    [produtoIds, usuarioId, DIAS_DE_HISTORICO, TOTAL_MOVIMENTACOES],
  )
}

async function main() {
  if (!temBanco()) {
    console.error('FALHA: DATABASE_URL não configurada — não é possível medir.')
    process.exit(1)
  }

  await resetarLimitadorDeLogin()
  await abrirTransacao()
  const app = criarApp()

  try {
    const hash = await bcrypt.hash(SENHA, 4)
    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Gestora Performance', $1, $2, 'GESTOR')
       returning id`,
      [GESTOR_EMAIL, hash],
    )
    const usuarioId = usuarios[0].id

    console.log(
      `Semeando base de teste: ${TOTAL_PRODUTOS} produtos e ${TOTAL_MOVIMENTACOES} movimentações em ${DIAS_DE_HISTORICO} dias...`,
    )
    const categoriaIds = await semearCategorias()
    const produtoIds = await semearProdutos(categoriaIds)
    await semearMovimentacoes(produtoIds, usuarioId)
    console.log('Seed pronto.\n')

    // Uma unica sessao autenticada, reaproveitada nas tres medicoes abaixo.
    const sessao = request.agent(app)
    const login = await sessao.post('/api/auth/login').send({ email: GESTOR_EMAIL, senha: SENHA })
    if (login.status !== 200) throw new Error(`Login de performance falhou (status ${login.status}).`)

    // 1) Busca em base de 500 produtos (RF03).
    const busca = await medir(() => sessao.get(`/api/produtos?busca=${encodeURIComponent('ração')}`))
    if (busca.saida.status !== 200) throw new Error(`Busca falhou (status ${busca.saida.status}).`)
    registrar(
      'busca-500-produtos',
      `Busca em base de ${TOTAL_PRODUTOS} produtos (${busca.saida.body.meta.total} resultados encontrados)`,
      busca.ms,
      LIMITE_BUSCA_MS,
    )

    // 2) Historico de movimentacoes de ~3 meses (RF11).
    const agora = new Date()
    const tresMesesAtras = new Date(agora.getTime() - DIAS_DE_HISTORICO * 24 * 3_600_000)
    const historico = await medir(() =>
      sessao.get(
        `/api/movimentacoes?de=${encodeURIComponent(tresMesesAtras.toISOString())}&ate=${encodeURIComponent(agora.toISOString())}`,
      ),
    )
    if (historico.saida.status !== 200) throw new Error(`Histórico falhou (status ${historico.saida.status}).`)
    registrar(
      'historico-3-meses',
      `Consulta de histórico de ${DIAS_DE_HISTORICO} dias (${historico.saida.body.meta.total} movimentações no período)`,
      historico.ms,
      LIMITE_HISTORICO_MS,
    )

    // 3) Carregamento completo do Dashboard: as chamadas que a tela dispara em
    // paralelo ao montar (F3-04) — cards + atencao, catalogo resumido e
    // ultima reposicao. O tempo medido e o do conjunto, nao de uma so rota.
    // (Aqui elas dividem uma unica conexao de teste, savepoint por query, e por
    // isso serializam por baixo dos panos — no servidor real cada uma sai numa
    // conexao do pool e roda de fato em paralelo; o tempo medido aqui e um teto,
    // nunca menor que o que a aplicacao real entrega.)
    const dashboard = await medir(() =>
      Promise.all([
        sessao.get('/api/dashboard'),
        sessao.get('/api/produtos?pagina=1&porPagina=10'),
        sessao.get('/api/movimentacoes?tipo=ENTRADA&pagina=1&porPagina=100'),
      ]),
    )
    const respostaComFalha = dashboard.saida.find((resposta) => resposta.status !== 200)
    if (respostaComFalha) throw new Error(`Dashboard falhou (status ${respostaComFalha.status}).`)
    registrar(
      'dashboard-completo',
      'Carregamento completo do Dashboard (cards, produtos em atenção, catálogo resumido e última reposição)',
      dashboard.ms,
      LIMITE_DASHBOARD_MS,
    )
  } finally {
    await desfazerTransacao()
  }

  const falhas = resultados.filter((r) => r.status === 'FALHA')

  console.log('=== F3-06 — Medição de desempenho ===\n')
  console.log(
    `Ambiente: mesma sessão autenticada e mesma transação de banco (seed: ${TOTAL_PRODUTOS} produtos, ${TOTAL_MOVIMENTACOES} movimentações em ${DIAS_DE_HISTORICO} dias).\n`,
  )
  for (const r of resultados) {
    const icone = r.status === 'OK' ? '✓' : '✗'
    console.log(`${icone} [${r.id}] ${r.descricao}`)
    console.log(`    ${r.ms.toFixed(0)} ms (limite: ${r.limiteMs} ms) — ${r.status}`)
  }
  console.log(`\nTotal: ${resultados.length} | OK: ${resultados.length - falhas.length} | Falhas: ${falhas.length}`)

  process.exit(falhas.length > 0 ? 1 : 0)
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
