import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

import { obterEnv } from './config/env.js'
import { NOME_COOKIE_SESSAO } from './config/sessao.js'
import { bancoResponde, obterPool } from './db/pool.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { rotas as auth } from './modules/auth/routes.js'
import { rotas as categorias } from './modules/categorias/routes.js'
import { rotas as fornecedores } from './modules/fornecedores/routes.js'
import { rotas as usuarios } from './modules/usuarios/routes.js'
import { AppError } from './shared/AppError.js'

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

  const PgSession = connectPgSimple(session)
  app.use(
    session({
      store: new PgSession({
        pool: obterPool(),
        tableName: 'session',
      }),
      name: NOME_COOKIE_SESSAO,
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      // Renova o maxAge a cada request: 8 h de inatividade (RN12), não desde o login.
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: env.producao,
        sameSite: 'lax',
        maxAge: env.sessionMaxAgeHoras * 3600000,
      },
    })
  )

  app.get('/api/health', async (_req, res) => {
    const banco = (await bancoResponde()) ? 'ok' : 'erro'
    res.status(banco === 'ok' ? 200 : 503).json({
      dados: { status: 'ok', banco, versao },
    })
  })

  app.use('/api/auth', auth)
  app.use('/api/usuarios', usuarios)
  app.use('/api/categorias', categorias)
  app.use('/api/fornecedores', fornecedores)

  app.use('/api', (_req, _res, next) => {
    next(new AppError('NAO_ENCONTRADO', 'Rota inexistente.'))
  })

  app.use(errorHandler)

  return app
}
