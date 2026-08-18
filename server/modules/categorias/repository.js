import { obterPool } from '../../db/pool.js'

const COLUNAS = 'id, nome, descricao, ativo'

// Toda funcao aceita uma conexao: assim o service pode chama-las dentro de uma
// transacao sem que o repositorio saiba disso.
export async function listar({ incluirInativas = false } = {}, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${COLUNAS} from public.categorias
     where ($1 or ativo)
     order by nome`,
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
