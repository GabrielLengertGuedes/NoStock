import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'

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

export async function iniciarBancoTemporario(nome) {
  if (!['nostock_test', 'nostock_e2e'].includes(nome)) {
    throw new Error('Nome de banco temporário de testes inválido')
  }

  const porta = await portaLivre()
  const diretorio = await mkdtemp(join(tmpdir(), `${nome}-`))
  const senha = randomBytes(24).toString('hex')
  const postgres = new EmbeddedPostgres({
    databaseDir: join(diretorio, 'postgres'), user: 'postgres', password: senha,
    port: porta, persistent: false, createPostgresUser: false,
    initdbFlags: ['--locale=C', '--locale-provider=builtin', '--builtin-locale=C.UTF-8', '--encoding=UTF8'],
    postgresFlags: ['-h', '127.0.0.1'],
    onLog: () => {}, onError: () => {},
  })

  const encerrar = async () => {
    await postgres.stop()
    await rm(diretorio, { recursive: true, force: true })
  }

  try {
    await postgres.initialise()
    await postgres.start()
    await postgres.createDatabase(nome)
    return { url: `postgresql://postgres:${senha}@127.0.0.1:${porta}/${nome}`, encerrar }
  } catch (erro) {
    await encerrar()
    throw new Error(String(erro?.message ?? 'Falha ao iniciar PostgreSQL temporário').split(senha).join('[oculto]'), { cause: erro })
  }
}
