import { obterPool } from '../../db/pool.js'

export async function buscarPorEmailPeloLogin(email) {
  const result = await obterPool().query(
    `
    select id, nome, email, senha_hash, papel, ativo
    from usuarios
    where lower(email) = lower($1)
    `,
    [email]
  )
  return result.rows[0] || null
}
