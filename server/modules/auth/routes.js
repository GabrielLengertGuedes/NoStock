import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { requireAuth } from '../../middlewares/auth.js'
import * as controlador from './controller.js'
import { corpoDoLogin } from './schema.js'
import { limitadorDeLogin } from './rateLimiter.js'

export const rotas = Router()

rotas.post('/login', limitadorDeLogin, validate({ body: corpoDoLogin }), controlador.login)
rotas.post('/logout', requireAuth, controlador.logout)
rotas.get('/me', requireAuth, controlador.me)
