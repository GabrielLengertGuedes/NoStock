#!/usr/bin/env node
// Gera um dump datado em db/backups/ e apaga os com mais de 7 dias.
// Restaura com: pg_restore -d "$DATABASE_URL" ARQUIVO
// Requer o pg_dump, que vem com o cliente do PostgreSQL.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const destino = join(raiz, 'db', 'backups')
const RETENCAO_DIAS = 7

// Em producao a variavel vem do ambiente e nao existe .env.
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const env = join(raiz, '.env')
  if (!existsSync(env)) return null

  for (const linha of readFileSync(env, 'utf8').split('\n')) {
    const par = linha.match(/^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/)
    if (par) return par[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

function carimbo() {
  const agora = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}-${p(agora.getHours())}${p(agora.getMinutes())}`
}

function limparAntigos() {
  const limite = Date.now() - RETENCAO_DIAS * 24 * 60 * 60 * 1000
  let apagados = 0

  for (const arquivo of readdirSync(destino)) {
    if (!arquivo.endsWith('.dump')) continue
    const caminho = join(destino, arquivo)
    if (statSync(caminho).mtimeMs >= limite) continue
    unlinkSync(caminho)
    apagados++
  }
  return apagados
}

const url = databaseUrl()
if (!url) {
  console.error('DATABASE_URL ausente. Preencha o .env.')
  process.exit(1)
}

mkdirSync(destino, { recursive: true })

const arquivo = join(destino, `nostock-${carimbo()}.dump`)
const dump = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', arquivo, url], {
  stdio: ['ignore', 'inherit', 'inherit'],
})

if (dump.error?.code === 'ENOENT') {
  console.error('pg_dump não encontrado. Instale o cliente do PostgreSQL.')
  process.exit(1)
}
if (dump.status !== 0) {
  console.error('pg_dump falhou. Nenhum backup gerado.')
  process.exit(dump.status ?? 1)
}

console.log(`Backup gerado: ${arquivo}`)

const apagados = limparAntigos()
if (apagados > 0) {
  console.log(`Removidos ${apagados} backups com mais de ${RETENCAO_DIAS} dias.`)
}
