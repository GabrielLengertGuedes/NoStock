import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { corpoDeCriacao, filtrosDeListagem } from './schema.js'

export const rotas = Router()

rotas.get('/', validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', requireAuth, validate({ body: corpoDeCriacao }), controlador.criar)
