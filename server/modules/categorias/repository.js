import { obterPool } from '../../db/pool.js'

const COLUNAS = 'id, nome, descricao, ativo'

// Toda funcao aceita uma conexao: assim o service pode chama-las dentro de uma
// transacao sem que o repositorio saiba disso.
export async function listar({ incluirInativas = false } = {}, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select c.id, c.nome, c.descricao, c.ativo,
            count(p.id)::int as "totalProdutos",
            coalesce(sum(p.quantidade_atual), 0)::int as "unidadesEmEstoque"
     from public.categorias c
     left join public.produtos p on p.categoria_id = c.id and p.ativo = true
     where ($1 or c.ativo)
     group by c.id
     order by c.nome`,
    [incluirInativas],
  )
  return rows
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${COLUNAS} from public.categorias where id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function criar({ nome, descricao }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `insert into public.categorias (nome, descricao) values ($1, $2) returning ${COLUNAS}`,
    [nome, descricao],
  )
  return rows[0]
}

export async function atualizar(id, { nome, descricao }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.categorias set nome = $2, descricao = $3
     where id = $1 returning ${COLUNAS}`,
    [id, nome, descricao],
  )
  return rows[0] ?? null
}

export async function inativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.categorias set ativo = false
     where id = $1 and ativo returning ${COLUNAS}`,
    [id],
  )
  return rows[0] ?? null
}

export async function temProdutosAtivos(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select 1 from public.produtos where categoria_id = $1 and ativo = true limit 1`,
    [id],
  )
  return rows.length > 0
}
