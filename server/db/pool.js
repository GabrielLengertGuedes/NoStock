import pg from 'pg'
import { obterEnv } from '../config/env.js'

let pool = null

export function obterPool() {
  if (pool) return pool

  const env = obterEnv()

  pool = new pg.Pool({
    connectionString: env.databaseUrl,
    // O Supabase usa cadeia propria: cifra a conexao, mas nao valida o certificado.
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

  // Sem este ouvinte, uma conexao ociosa derrubada pelo servidor mata o processo.
  pool.on('error', (erro) => {
    console.error('Erro em conexão ociosa:', erro.message)
  })

  return pool
}

export async function bancoResponde() {
  try {
    await obterPool().query('select 1')
    return true
  } catch (erro) {
    console.error('Banco inacessível:', erro.message)
    return false
  }
}

export async function fecharPool() {
  if (!pool) return
  const atual = pool
  pool = null
  await atual.end()
}
