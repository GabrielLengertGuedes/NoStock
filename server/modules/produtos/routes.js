import { Router } from 'express'

import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { filtrosDeListagem } from './schema.js'

export const rotas = Router()

rotas.get('/', validate({ query: filtrosDeListagem }), controlador.listar)
