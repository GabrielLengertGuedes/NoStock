import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { obterEnv } from './config/env.js'
import { bancoResponde } from './db/pool.js'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const versao = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).version

export function criarApp() {
  const env = obterEnv()
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())

  // Em producao o front sai da propria API, entao nao ha origem cruzada.
  if (!env.producao) {
    app.use(cors({ origin: env.corsOrigin, credentials: true }))
  }

  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', async (_req, res) => {
    const banco = (await bancoResponde()) ? 'ok' : 'erro'
    res.status(banco === 'ok' ? 200 : 503).json({
      dados: { status: 'ok', banco, versao },
    })
  })

  app.use('/api', (_req, res) => {
    res.status(404).json({
      erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Rota inexistente.' },
    })
  })

  return app
}
