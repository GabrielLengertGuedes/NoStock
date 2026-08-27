import { Router } from 'express'

import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { corpoDeAtualizacao, corpoDeCriacao, filtrosDeListagem, parametroId } from './schema.js'

export const rotas = Router()

const soGestor = [requireAuth, requireRole('GESTOR')]

rotas.get('/', validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', requireAuth, validate({ body: corpoDeCriacao }), controlador.criar)
rotas.put(
  '/:id',
  requireAuth,
  validate({ params: parametroId, body: corpoDeAtualizacao }),
  controlador.atualizar,
)
rotas.delete('/:id', ...soGestor, validate({ params: parametroId }), controlador.inativar)
rotas.post(
  '/:id/reativar',
  ...soGestor,
  validate({ params: parametroId }),
  controlador.reativar,
)
