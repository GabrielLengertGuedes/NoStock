import pg from 'pg'

import { obterEnv } from '../../server/config/env.js'
import { definirPool } from '../../server/db/pool.js'

export const temBanco = () => Boolean(process.env.DATABASE_URL)

let cliente = null
let profundidade = 0

// Converte o begin/commit/rollback do codigo em savepoint, para a transacao
// externa do teste continuar de pe ate o fim.
function encaminhar(texto, valores) {
  if (!cliente) {
    return Promise.reject(new Error('cliente de teste indisponível'))
  }

  const sql = typeof texto === 'string' ? texto.trim().toLowerCase() : ''

  if (sql === 'begin') {
    profundidade += 1
    return cliente.query(`savepoint ponto_${profundidade}`)
  }
  if (sql === 'commit') {
    return cliente.query(`release savepoint ponto_${profundidade--}`)
  }
  if (sql === 'rollback') {
    return cliente.query(`rollback to savepoint ponto_${profundidade--}`)
  }
  return cliente.query(texto, valores)
}

// Abre uma transacao e faz a API usar este mesmo cliente. Nada do que o teste
// escrever chega ao banco de verdade: o desfazer no fim apaga tudo.
export async function abrirTransacao() {
  await desfazerTransacao()

  cliente = new pg.Client({
    connectionString: obterEnv().databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await cliente.connect()
  await cliente.query('begin')
  profundidade = 0

  const conexao = { query: encaminhar, release() {} }
  definirPool({
    query: encaminhar,
    connect: async () => conexao,
    end: async () => {},
    on() {},
  })

  return cliente
}

// Falha aqui nao pode virar o erro do teste: se a conexao ja caiu, o motivo
// verdadeiro esta na falha original, nao no rollback que veio depois.
export async function desfazerTransacao() {
  definirPool(null)
  if (!cliente) return

  const atual = cliente
  cliente = null
  profundidade = 0

  try {
    await atual.query('rollback')
  } catch {
    // conexao ja perdida: nao ha o que desfazer
  }

  try {
    await atual.end()
  } catch {
    // idem
  }
}
