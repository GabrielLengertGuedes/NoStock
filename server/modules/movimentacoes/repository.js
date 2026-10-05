import { obterPool } from '../../db/pool.js'
import { condicaoBuscaPorNome, termoLiteral } from '../../shared/buscaPorNome.js'

const SELECAO_LISTAGEM = `
  m.id,
  m.produto_id as "produtoId",
  jsonb_build_object('id', p.id, 'nome', p.nome) as produto,
  m.tipo,
  m.motivo,
  m.quantidade,
  m.saldo_anterior as "saldoAnterior",
  m.saldo_posterior as "saldoPosterior",
  m.preco_unitario::float8 as "precoUnitario",
  m.observacao,
  m.criado_em as "criadoEm",
  jsonb_build_object('id', u.id, 'nome', u.nome) as usuario
`

const JUNCOES_LISTAGEM = `
  from public.movimentacoes m
  join public.usuarios u on u.id = m.usuario_id
  join public.produtos p on p.id = m.produto_id
`

// Todo filtro olha so colunas de m: a contagem roda sem as juncoes da listagem.
// A busca por nome resolve os produtos numa subconsulta, que usa o indice
// trigram de produtos e depois ix_mov_produto_criado. Produto inativo entra:
// a movimentacao dele continua no historico.
function filtrar({ produtoId, busca, usuarioId, tipo, motivo, de, ate }) {
  const condicoes = []
  const valores = []

  const proximoParametro = (valor) => {
    valores.push(valor)
    return `$${valores.length}`
  }

  if (produtoId) condicoes.push(`m.produto_id = ${proximoParametro(produtoId)}`)
  if (busca) {
    const condicao = condicaoBuscaPorNome('pb.nome', proximoParametro(termoLiteral(busca)))
    condicoes.push(`m.produto_id in (select pb.id from public.produtos pb where ${condicao})`)
  }
  if (usuarioId) condicoes.push(`m.usuario_id = ${proximoParametro(usuarioId)}`)
  if (tipo) condicoes.push(`m.tipo = ${proximoParametro(tipo)}`)
  if (motivo) condicoes.push(`m.motivo = ${proximoParametro(motivo)}`)
  if (de) condicoes.push(`m.criado_em >= ${proximoParametro(de)}`)
  if (ate) condicoes.push(`m.criado_em <= ${proximoParametro(ate)}`)

  return {
    onde: condicoes.length ? `where ${condicoes.join(' and ')}` : '',
    valores,
  }
}

export async function listar(filtros, conexao = obterPool()) {
  const { pagina = 1, porPagina = 20 } = filtros
  const { onde, valores } = filtrar(filtros)

  // Sem as juncoes: produto_id e usuario_id sao not null com FK, entao juntar
  // nao muda a contagem — so dobrava o custo dela numa tabela que so cresce.
  const { rows: contagem } = await conexao.query(
    `select count(*)::int as total from public.movimentacoes m ${onde}`,
    valores,
  )
  const total = contagem[0].total

  const limite = `$${valores.length + 1}`
  const deslocamento = `$${valores.length + 2}`

  const { rows: movimentacoes } = await conexao.query(
    `select ${SELECAO_LISTAGEM}
       ${JUNCOES_LISTAGEM}
       ${onde}
       order by m.criado_em desc
       limit ${limite} offset ${deslocamento}`,
    [...valores, porPagina, (pagina - 1) * porPagina],
  )

  return { movimentacoes, total }
}

export async function produtoExiste(produtoId, conexao = obterPool()) {
  const { rows } = await conexao.query(`select 1 from public.produtos where id = $1 limit 1`, [
    produtoId,
  ])
  return rows.length > 0
}

// ADR-004: trava a linha do produto antes de ler o saldo e gravar a movimentação.
export async function trancarProdutoAtivo(produtoId, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select quantidade_atual, preco_venda, estoque_minimo
       from public.produtos
      where id = $1 and ativo
        for update`,
    [produtoId],
  )
  return rows[0] ?? null
}

export async function atualizarSaldo(produtoId, saldoPosterior, conexao = obterPool()) {
  await conexao.query(
    `update public.produtos set quantidade_atual = $2 where id = $1`,
    [produtoId, saldoPosterior],
  )
}

export async function inserirMovimentacao(
  {
    produtoId,
    usuarioId,
    tipo,
    motivo,
    quantidade,
    saldoAnterior,
    saldoPosterior,
    precoUnitario,
    observacao,
  },
  conexao = obterPool(),
) {
  const { rows } = await conexao.query(
    `insert into public.movimentacoes
       (produto_id, usuario_id, tipo, motivo, quantidade,
        saldo_anterior, saldo_posterior, preco_unitario, observacao)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      produtoId,
      usuarioId,
      tipo,
      motivo,
      quantidade,
      saldoAnterior,
      saldoPosterior,
      precoUnitario,
      observacao,
    ],
  )
  return rows[0].id
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select m.id,
            m.produto_id as "produtoId",
            m.tipo,
            m.motivo,
            m.quantidade,
            m.saldo_anterior as "saldoAnterior",
            m.saldo_posterior as "saldoPosterior",
            m.preco_unitario::float8 as "precoUnitario",
            m.observacao,
            m.criado_em as "criadoEm",
            jsonb_build_object('id', u.id, 'nome', u.nome) as usuario,
            p.estoque_minimo as "estoqueMinimo"
       from public.movimentacoes m
       join public.usuarios u on u.id = m.usuario_id
       join public.produtos p on p.id = m.produto_id
      where m.id = $1`,
    [id],
  )
  return rows[0] ?? null
}
