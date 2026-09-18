import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import * as controlador from './controller.js'

export const rotas = Router()

rotas.get('/', requireAuth, controlador.obterResumo)
