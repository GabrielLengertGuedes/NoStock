import pg from 'pg'
import { obterEnv } from '../config/env.js'

let pool = null

// O Supabase usa cadeia propria: cifra a conexao, mas nao valida o certificado.
// Um Postgres local — o contêiner do CI, por exemplo — nao oferece TLS, e exigir
// SSL contra ele derruba a conexao. Decidir pela propria URL evita mais uma
// variavel de ambiente para alguem esquecer de configurar.
export function sslDoBanco(url) {
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || /sslmode=disable/.test(url)
  return local ? false : { rejectUnauthorized: false }
}

export function obterPool() {
  if (pool) return pool

  const env = obterEnv()

  pool = new pg.Pool({
    connectionString: env.databaseUrl,
    ssl: sslDoBanco(env.databaseUrl),
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

// Usado so pelos testes: troca o pool pelo cliente da transacao de teste.
export function definirPool(substituto) {
  pool = substituto
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
