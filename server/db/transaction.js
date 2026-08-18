import { obterPool } from './pool.js'

// Roda o callback numa transacao: ou tudo entra, ou nada entra.
// O lock_timeout impede que uma linha travada segure a requisicao sem fim.
export async function emTransacao(callback) {
  const cliente = await obterPool().connect()

  try {
    await cliente.query('begin')
    await cliente.query("set local lock_timeout = '5s'")

    const resultado = await callback(cliente)

    await cliente.query('commit')
    return resultado
  } catch (erro) {
    try {
      await cliente.query('rollback')
    } catch (erroRollback) {
      console.error('Falha ao desfazer a transação:', erroRollback.message)
    }
    throw erro
  } finally {
    cliente.release()
  }
}
