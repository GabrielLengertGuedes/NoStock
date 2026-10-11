import { obterPool } from '../../db/pool.js'

const COLUNAS_PUBLICAS = 'id, nome, email, papel, ativo'

export async function buscarPorEmailPeloLogin(email, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    select id, nome, email, senha_hash, papel, ativo
    from public.usuarios
    where lower(email) = lower($1)
    `,
    [email],
  )
  return rows[0] ?? null
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${COLUNAS_PUBLICAS} from public.usuarios where id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function buscarCredenciaisPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    select id, nome, email, senha_hash, papel, ativo
    from public.usuarios
    where id = $1
    `,
    [id],
  )
  return rows[0] ?? null
}

export async function listar({ ativo = 'true' } = {}, conexao = obterPool()) {
  const filtro =
    ativo === 'todos' ? '' : ativo === 'false' ? 'where not ativo' : 'where ativo'

  const { rows } = await conexao.query(
    `select ${COLUNAS_PUBLICAS} from public.usuarios ${filtro} order by nome, id`,
  )
  return rows
}

export async function criar({ nome, email, senhaHash, papel }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    insert into public.usuarios (nome, email, senha_hash, papel)
    values ($1, $2, $3, $4)
    returning ${COLUNAS_PUBLICAS}
    `,
    [nome, email, senhaHash, papel],
  )
  return rows[0]
}

export async function atualizar(id, { nome, email, papel }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    update public.usuarios
    set nome = $2, email = $3, papel = $4
    where id = $1
    returning ${COLUNAS_PUBLICAS}
    `,
    [id, nome, email, papel],
  )
  return rows[0] ?? null
}

export async function atualizarSenha(id, senhaHash, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    update public.usuarios set senha_hash = $2
    where id = $1
    returning ${COLUNAS_PUBLICAS}
    `,
    [id, senhaHash],
  )
  return rows[0] ?? null
}

export async function inativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    update public.usuarios set ativo = false
    where id = $1 and ativo
    returning ${COLUNAS_PUBLICAS}
    `,
    [id],
  )
  return rows[0] ?? null
}

export async function reativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `
    update public.usuarios set ativo = true
    where id = $1 and not ativo
    returning ${COLUNAS_PUBLICAS}
    `,
    [id],
  )
  return rows[0] ?? null
}

// Trava as linhas dos gestores ativos ate o fim da transacao: dois pedidos
// simultaneos, cada um inativando um dos dois ultimos gestores, nao podem os
// dois contar "2" e passar. O segundo espera e reconta sem o primeiro.
export async function contarGestoresAtivosTravando(conexao) {
  const { rows } = await conexao.query(
    `select id from public.usuarios where papel = 'GESTOR' and ativo for update`,
  )
  return rows.length
}

// Derruba as sessoes abertas do usuario. `exceto` preserva a sessao de quem
// fez a troca de senha, para ele nao ser deslogado pela propria acao.
export async function encerrarSessoes(usuarioId, { exceto = null } = {}, conexao = obterPool()) {
  await conexao.query(
    `delete from public."session"
      where sess->>'usuarioId' = $1::text
        and ($2::text is null or sid <> $2::text)`,
    [usuarioId, exceto],
  )
}
