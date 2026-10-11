import { obterPool } from '../../db/pool.js'

const SELECAO = `
  endpoint,
  nivel,
  criado_em as "criadoEm"
`

export async function listarDoUsuario(usuarioId, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${SELECAO} from public.inscricoes_push where usuario_id = $1 order by criado_em desc`,
    [usuarioId],
  )
  return rows
}

// O mesmo aparelho entrando com outro usuario passa a ser desse usuario.
export async function salvar({ usuarioId, endpoint, p256dh, auth, nivel }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `insert into public.inscricoes_push (usuario_id, endpoint, p256dh, auth, nivel)
     values ($1, $2, $3, $4, $5)
     on conflict (endpoint) do update
       set usuario_id = excluded.usuario_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           nivel = excluded.nivel
     returning ${SELECAO}`,
    [usuarioId, endpoint, p256dh, auth, nivel],
  )
  return rows[0]
}

export async function buscarDoUsuario({ usuarioId, endpoint }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select endpoint, p256dh, auth, nivel
       from public.inscricoes_push
      where usuario_id = $1 and endpoint = $2`,
    [usuarioId, endpoint],
  )
  return rows[0] ?? null
}

export async function remover({ usuarioId, endpoint }, conexao = obterPool()) {
  await conexao.query(
    `delete from public.inscricoes_push where usuario_id = $1 and endpoint = $2`,
    [usuarioId, endpoint],
  )
}

export async function removerExpiradas(endpoints, conexao = obterPool()) {
  if (endpoints.length === 0) return
  await conexao.query(`delete from public.inscricoes_push where endpoint = any($1)`, [endpoints])
}

// Quem recebe o alerta de um produto que chegou a `status`: usuarios ativos
// cujo nivel escolhido ja foi alcancado (a ordem do enum e BAIXO < CRITICO <
// SEM_ESTOQUE), menos quem registrou a movimentacao, que ja viu na tela.
// Papel e situacao valem os de agora, nao os do dia da inscricao.
export async function destinatarios({ status, autorId }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select i.endpoint, i.p256dh, i.auth
       from public.inscricoes_push i
       join public.usuarios u on u.id = i.usuario_id
      where u.ativo
        and i.usuario_id <> $2
        and i.nivel <= $1::public.nivel_alerta`,
    [status, autorId],
  )
  return rows
}

export async function dadosDoProduto(produtoId, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select p.id, p.nome, p.estoque_minimo as "estoqueMinimo", f.nome as "fornecedorNome"
       from public.produtos p
       left join public.fornecedores f on f.id = p.fornecedor_id
      where p.id = $1`,
    [produtoId],
  )
  return rows[0] ?? null
}
