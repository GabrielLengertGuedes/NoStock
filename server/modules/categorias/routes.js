import { Router } from 'express'

import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import {
  corpoDeAtualizacao,
  corpoDeCriacao,
  filtrosDeListagem,
  parametroId,
} from './schema.js'

export const rotas = Router()

const autenticado = [requireAuth]
const soGestor = [requireAuth, requireRole('GESTOR')]

rotas.get('/', ...autenticado, validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', ...soGestor, validate({ body: corpoDeCriacao }), controlador.criar)
rotas.get('/:id', ...autenticado, validate({ params: parametroId }), controlador.buscarPorId)
rotas.put('/:id', ...soGestor, validate({ params: parametroId, body: corpoDeAtualizacao }), controlador.atualizar)
rotas.delete('/:id', ...soGestor, validate({ params: parametroId }), controlador.inativar)
