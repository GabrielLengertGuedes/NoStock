import { criarApp } from './app.js'
import { obterEnv } from './config/env.js'
import { bancoResponde, fecharPool } from './db/pool.js'

let env
try {
  env = obterEnv()
} catch (erro) {
  console.error(erro.message)
  process.exit(1)
}

const servidor = criarApp().listen(env.porta, async () => {
  console.log(`API em http://localhost:${env.porta} (${env.nodeEnv})`)
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
