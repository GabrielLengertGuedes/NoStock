import { obterPool } from '../../db/pool.js'
import { statusEstoqueSql } from '../../shared/statusEstoque.js'

const STATUS_SQL = statusEstoqueSql('p.quantidade_atual', 'p.estoque_minimo')

const COLUNA_DE_ORDENACAO = {
  nome: 'p.nome',
  quantidade: 'p.quantidade_atual',
  categoria: 'c.nome',
}

// Mesma forma em toda consulta que devolve produto: listagem, criacao e (mais
// tarde) atualizacao. Um so lugar decide o formato do objeto "produto" da API.
// O cast para float8 evita que o driver devolva preco_venda como string: sem ele
// o front receberia "189.90" (numeric vira string no pg) em vez do numero 189.90.
const SELECAO = `
  p.id, p.nome, p.descricao,
  jsonb_build_object('id', c.id, 'nome', c.nome) as categoria,
  case when f.id is null then null
       else jsonb_build_object('id', f.id, 'nome', f.nome) end as fornecedor,
  p.preco_venda::float8 as "precoVenda",
  p.quantidade_atual as "quantidadeAtual",
  p.estoque_minimo as "estoqueMinimo",
  ${STATUS_SQL} as "statusEstoque",
  p.ativo
`

const JUNCOES = `
  from public.produtos p
  join public.categorias c on c.id = p.categoria_id
  left join public.fornecedores f on f.id = p.fornecedor_id
`

// Reaproveitada pela contagem e pela pagina: as duas precisam do mesmo filtro,
// so a segunda tambem junta categoria/fornecedor para exibir o nome.
function filtrar({ busca, categoriaId, fornecedorId, status, ativo }) {
  const condicoes = []
  const valores = []

  const proximoParametro = (valor) => {
    valores.push(valor)
    return `$${valores.length}`
  }

  if (ativo !== 'todos') {
    condicoes.push(`p.ativo = ${proximoParametro(ativo === 'true')}`)
  }
  if (busca) {
    condicoes.push(
      `public.sem_acento(lower(p.nome)) like ('%' || public.sem_acento(lower(${proximoParametro(busca)})) || '%')`,
    )
  }
  if (categoriaId) {
    condicoes.push(`p.categoria_id = ${proximoParametro(categoriaId)}`)
  }
  if (fornecedorId) {
    condicoes.push(`p.fornecedor_id = ${proximoParametro(fornecedorId)}`)
  }
  if (status === 'PRECISA_REPOR') {
    condicoes.push(`(${STATUS_SQL}) in ('BAIXO', 'CRITICO', 'SEM_ESTOQUE')`)
  } else if (status) {
    condicoes.push(`(${STATUS_SQL}) = ${proximoParametro(status)}`)
  }

  return {
    onde: condicoes.length ? `where ${condicoes.join(' and ')}` : '',
    valores,
  }
}

export async function listar(filtros, conexao = obterPool()) {
  const { pagina = 1, porPagina = 20, ordenarPor = 'nome', ordem = 'asc' } = filtros

  const { onde, valores } = filtrar(filtros)

  const { rows: contagem } = await conexao.query(
    `select count(*)::int as total from public.produtos p ${onde}`,
    valores,
  )
  const total = contagem[0].total

  const coluna = COLUNA_DE_ORDENACAO[ordenarPor] ?? COLUNA_DE_ORDENACAO.nome
  const direcao = ordem === 'desc' ? 'desc' : 'asc'
  const limite = `$${valores.length + 1}`
  const deslocamento = `$${valores.length + 2}`

  const { rows: produtos } = await conexao.query(
    `select ${SELECAO} ${JUNCOES}
       ${onde}
       order by ${coluna} ${direcao}
       limit ${limite} offset ${deslocamento}`,
    [...valores, porPagina, (pagina - 1) * porPagina],
  )

  return { produtos, total }
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${SELECAO} ${JUNCOES} where p.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function existeAtivoComMesmoNome(nome, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select 1 from public.produtos where nome = $1 and ativo limit 1`,
    [nome],
  )
  return rows.length > 0
}

export async function criar(dados, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `insert into public.produtos
       (nome, descricao, categoria_id, fornecedor_id, preco_venda, quantidade_atual, estoque_minimo)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      dados.nome,
      dados.descricao,
      dados.categoriaId,
      dados.fornecedorId,
      dados.precoVenda,
      dados.estoqueInicial,
      dados.estoqueMinimo,
    ],
  )
  return rows[0].id
}

// RN02: todo saldo criado com produto novo tambem vira uma movimentacao,
// para o historico nascer completo em vez de comecar com um numero do nada.
export async function registrarEstoqueInicial(
  { produtoId, usuarioId, quantidade, precoVenda },
  conexao = obterPool(),
) {
  await conexao.query(
    `insert into public.movimentacoes
       (produto_id, usuario_id, tipo, motivo, quantidade, saldo_anterior, saldo_posterior, preco_unitario)
     values ($1, $2, 'ENTRADA', 'ESTOQUE_INICIAL', $3, 0, $3, $4)`,
    [produtoId, usuarioId, quantidade, precoVenda],
  )
}
