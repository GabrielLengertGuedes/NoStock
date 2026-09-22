import { Router } from 'express'

import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { filtrosDeReposicao } from './schema.js'

export const rotas = Router()

// Sugestao de compra: acesso restrito a gestor (RN10).
const soGestor = [requireAuth, requireRole('GESTOR')]

rotas.get('/', ...soGestor, validate({ query: filtrosDeReposicao }), controlador.listar)
