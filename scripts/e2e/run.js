import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { prepararBancoE2E } from './database.js'
import { iniciarBancoTemporario } from '../tests/postgres.js'

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

let banco

try {
  console.log('E2E: iniciando PostgreSQL 17 temporário e exclusivo.')
  banco = await iniciarBancoTemporario('nostock_e2e')
  process.env.E2E_DATABASE_URL = banco.url
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
  const senha = banco ? new URL(banco.url).password : ''
  const mensagem = String(erro?.message ?? 'Falha ao iniciar o ambiente de testes')
  console.error('E2E:', senha ? mensagem.split(senha).join('[oculto]') : mensagem)
  process.exitCode = 1
} finally {
  try {
    if (banco) await banco.encerrar()
    console.log('E2E: instância temporária encerrada e removida.')
  } catch {
    console.error('E2E: não foi possível concluir a limpeza da instância temporária.')
    process.exitCode = 1
  }
}
