import { obterPool } from '../../db/pool.js'
import { condicaoBuscaPorNome, termoLiteral } from '../../shared/buscaPorNome.js'
import { statusEstoqueSql } from '../../shared/statusEstoque.js'

const STATUS_SQL = statusEstoqueSql('p.quantidade_atual', 'p.estoque_minimo')

// Ultima compra do produto. Estoque inicial, devolucao e ajuste nao contam:
// reposicao e quando a loja comprou mais. Usa ix_mov_produto_criado.
export const ULTIMA_REPOSICAO_SQL = `(
  select max(mr.criado_em) from public.movimentacoes mr
   where mr.produto_id = p.id and mr.tipo = 'ENTRADA' and mr.motivo = 'COMPRA'
)`

const COLUNA_DE_ORDENACAO = {
  nome: 'p.nome',
  quantidade: 'p.quantidade_atual',
  categoria: 'c.nome',
}

// Mesma forma em toda consulta que devolve produto: listagem, criacao e (mais
// tarde) atualizacao. Um so lugar decide o formato do objeto "produto" da API.
// O cast para float8 evita que o driver devolva preco_venda como string: sem ele
// o front receberia "189.90" (numeric vira string no pg) em vez do numero 189.90.
function selecao(fornecedor) {
  return `
  p.id, p.nome, p.descricao,
  jsonb_build_object('id', c.id, 'nome', c.nome) as categoria,
  case when f.id is null then null else ${fornecedor} end as fornecedor,
  p.preco_venda::float8 as "precoVenda",
  p.quantidade_atual as "quantidadeAtual",
  p.estoque_minimo as "estoqueMinimo",
  ${STATUS_SQL} as "statusEstoque",
  ${ULTIMA_REPOSICAO_SQL} as "ultimaReposicao",
  p.ativo
`
}

const SELECAO = selecao(`jsonb_build_object('id', f.id, 'nome', f.nome)`)

// O detalhe traz tambem o contato do fornecedor: na tela do produto, no
// celular, ligar ou chamar no WhatsApp e o proximo passo de quem viu que acabou.
const SELECAO_DETALHE = selecao(`jsonb_build_object(
    'id', f.id, 'nome', f.nome, 'contatoNome', f.contato_nome,
    'telefone', f.telefone, 'email', f.email)`)

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
    condicoes.push(condicaoBuscaPorNome('p.nome', proximoParametro(termoLiteral(busca))))
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
  // p.id desempata: sem ele, produtos com a mesma quantidade (ou o mesmo nome)
  // trocam de ordem entre uma consulta e outra e repetem ou somem entre paginas.
  const limite = `$${valores.length + 1}`
  const deslocamento = `$${valores.length + 2}`

  const { rows: produtos } = await conexao.query(
    `select ${SELECAO} ${JUNCOES}
       ${onde}
       order by ${coluna} ${direcao}, p.id ${direcao}
       limit ${limite} offset ${deslocamento}`,
    [...valores, porPagina, (pagina - 1) * porPagina],
  )

  return { produtos, total }
}

// Indicadores da tela de Produtos, somados no banco: antes o front percorria
// o catalogo inteiro, 100 produtos por requisicao, para chegar no valor.
export async function obterResumo(conexao = obterPool()) {
  const { rows } = await conexao.query(`
    select count(*)::int as "totalProdutos",
           count(*) filter (where (${STATUS_SQL}) <> 'NORMAL')::int as "precisamRepor",
           coalesce(sum(p.quantidade_atual * p.preco_venda), 0)::float8 as "valorInventario"
      from public.produtos p
     where p.ativo
  `)
  return rows[0]
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${SELECAO} ${JUNCOES} where p.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function buscarDetalhe(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${SELECAO_DETALHE} ${JUNCOES} where p.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

// excluirId existe para a atualizacao: o proprio produto nao pode contar como
// duplicata do seu nome atual quando ele so esta sendo resalvo sem mudar nada.
export async function existeAtivoComMesmoNome({ nome, excluirId }, conexao = obterPool()) {
  const condicaoId = excluirId ? 'and id != $2' : ''
  const valores = excluirId ? [nome, excluirId] : [nome]

  const { rows } = await conexao.query(
    `select 1 from public.produtos where nome = $1 and ativo ${condicaoId} limit 1`,
    valores,
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

// quantidade_atual nunca aparece aqui: o saldo so muda por movimentacao (RN02).
export async function atualizar(id, dados, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.produtos
        set nome = $2, descricao = $3, categoria_id = $4, fornecedor_id = $5,
            preco_venda = $6, estoque_minimo = $7
      where id = $1
      returning id`,
    [id, dados.nome, dados.descricao, dados.categoriaId, dados.fornecedorId, dados.precoVenda, dados.estoqueMinimo],
  )
  return rows[0]?.id ?? null
}

export async function inativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.produtos set ativo = false where id = $1 and ativo returning id`,
    [id],
  )
  return rows[0]?.id ?? null
}

export async function reativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.produtos set ativo = true where id = $1 and not ativo returning id`,
    [id],
  )
  return rows[0]?.id ?? null
}
