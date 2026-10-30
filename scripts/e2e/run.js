import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

import { prepararBancoE2E } from './database.js'

process.chdir(fileURLToPath(new URL('../../', import.meta.url)))

function executar(arquivo, argumentos, env) {
  return new Promise((resolve, reject) => {
    const filho = spawn(process.execPath, [arquivo, ...argumentos], { stdio: 'inherit', env })
    const interromper = () => filho.kill('SIGTERM')
    process.once('SIGINT', interromper)
    process.once('SIGTERM', interromper)
    filho.once('error', reject)
    filho.once('exit', (codigo) => {
      process.removeListener('SIGINT', interromper)
      process.removeListener('SIGTERM', interromper)
      resolve(codigo ?? 1)
    })
  })
}

async function portaLivre() {
  const servidor = createServer()
  await new Promise((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(0, '127.0.0.1', resolve)
  })
  const porta = servidor.address().port
  await new Promise((resolve) => servidor.close(resolve))
  return porta
}

const diretorio = await mkdtemp(join(tmpdir(), 'nostock-e2e-'))
const porta = await portaLivre()
const senha = randomBytes(24).toString('hex')
const postgres = new EmbeddedPostgres({
  databaseDir: join(diretorio, 'postgres'), user: 'postgres', password: senha,
  port: porta, persistent: false, createPostgresUser: false,
  initdbFlags: ['--locale=C', '--encoding=UTF8'],
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {}, onError: () => {},
})

try {
  console.log('E2E: iniciando PostgreSQL 17 temporário e exclusivo.')
  await postgres.initialise()
  await postgres.start()
  await postgres.createDatabase('nostock_e2e')
  process.env.E2E_DATABASE_URL = `postgresql://postgres:${senha}@127.0.0.1:${porta}/nostock_e2e`
  await prepararBancoE2E()
  const env = {
    ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL, DATABASE_CA_CERT: '',
    SESSION_SECRET: randomBytes(32).toString('hex'), VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '', VAPID_SUBJECT: '', NODE_ENV: 'production',
    FUSO_HORARIO: 'America/Sao_Paulo', SESSION_MAX_AGE_HOURS: '8',
  }
  const build = await executar('node_modules/vite/bin/vite.js', ['build', '--config', 'vite.e2e.config.js'], env)
  process.exitCode = build || await executar('node_modules/@playwright/test/cli.js', ['test', ...process.argv.slice(2)], env)
} catch (erro) {
  // Erros de conexão podem conter a URL; as credenciais efêmeras também não vão para logs.
  console.error('E2E:', String(erro?.message ?? 'Falha ao iniciar o ambiente de testes').split(senha).join('[oculto]'))
  process.exitCode = 1
} finally {
  try {
    await postgres.stop()
    await rm(diretorio, { recursive: true, force: true })
    console.log('E2E: instância temporária encerrada e removida.')
  } catch {
    console.error('E2E: não foi possível concluir a limpeza da instância temporária.')
    process.exitCode = 1
  }
}
