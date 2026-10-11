import { criarApp } from './app.js'
import { obterEnv } from './config/env.js'
import { bancoResponde, fecharPool, sslDoBanco } from './db/pool.js'

let env
try {
  env = obterEnv()
} catch (erro) {
  console.error(erro.message)
  process.exit(1)
}

const servidor = criarApp().listen(env.porta, async () => {
  console.log(`API em http://localhost:${env.porta} (${env.nodeEnv})`)
  if (env.producao && !env.databaseCaCert && sslDoBanco(env.databaseUrl)) {
    console.warn(
      'DATABASE_CA_CERT não definida: a conexão com o banco é cifrada, mas o certificado não é validado.',
    )
  }
  console.log(
    (await bancoResponde())
      ? 'Banco conectado.'
      : 'Banco inacessível: confira a DATABASE_URL no .env.',
  )
})

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    servidor.close(async () => {
      await fecharPool()
      process.exit(0)
    })
  })
}
