import { readFileSync } from 'node:fs'

import pg from 'pg'
import { obterEnv } from '../config/env.js'

let pool = null

// O painel guarda variavel numa linha so: o PEM pode vir com "\n" literal.
function lerCertificado(valor) {
  if (valor.startsWith('-----BEGIN')) return valor.replace(/\\n/g, '\n')
  return readFileSync(valor, 'utf8')
}

// Um Postgres local — o contêiner do CI, por exemplo — nao oferece TLS, e exigir
// SSL contra ele derruba a conexao. Decidir pela propria URL evita mais uma
// variavel de ambiente para alguem esquecer de configurar.
// O Supabase assina com CA propria. Com DATABASE_CA_CERT a conexao valida o
// certificado (protege contra quem se ponha no meio do caminho); sem ela, so
// cifra — e a API avisa no log de producao.
export function sslDoBanco(url, certificadoCa = null) {
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || /sslmode=disable/.test(url)
  if (local) return false
  if (certificadoCa) return { ca: lerCertificado(certificadoCa), rejectUnauthorized: true }
  return { rejectUnauthorized: false }
}

export function obterPool() {
  if (pool) return pool

  const env = obterEnv()

  pool = new pg.Pool({
    connectionString: env.databaseUrl,
    ssl: sslDoBanco(env.databaseUrl, env.databaseCaCert),
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
