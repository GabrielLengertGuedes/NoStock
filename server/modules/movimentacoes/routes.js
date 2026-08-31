import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { corpoDeRegistro, filtrosDeListagem } from './schema.js'

export const rotas = Router()

rotas.get('/', requireAuth, validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', requireAuth, validate({ body: corpoDeRegistro }), controlador.registrar)
