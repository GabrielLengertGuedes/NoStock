import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { limitadorDeLogin, recusarSeBloqueado } from './rateLimiter.js'
import { corpoDoLogin } from './schema.js'

export const rotas = Router()

rotas.post(
  '/login',
  recusarSeBloqueado,
  limitadorDeLogin,
  validate({ body: corpoDoLogin }),
  controlador.login,
)
rotas.post('/logout', requireAuth, controlador.logout)
rotas.get('/me', requireAuth, controlador.me)
