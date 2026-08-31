import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { corpoDeRegistro } from './schema.js'

export const rotas = Router()

rotas.post('/', requireAuth, validate({ body: corpoDeRegistro }), controlador.registrar)
