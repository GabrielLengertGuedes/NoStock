import { Router } from 'express'

import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import {
  corpoDeAtualizacao,
  corpoDeCriacao,
  corpoDeNovaSenha,
  filtrosDeListagem,
  parametroId,
} from './schema.js'

export const rotas = Router()

const soGestor = [requireAuth, requireRole('GESTOR')]

rotas.get('/', ...soGestor, validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', ...soGestor, validate({ body: corpoDeCriacao }), controlador.criar)
rotas.patch(
  '/:id/senha',
  ...soGestor,
  validate({ params: parametroId, body: corpoDeNovaSenha }),
  controlador.redefinirSenha,
)
rotas.post(
  '/:id/reativar',
  ...soGestor,
  validate({ params: parametroId }),
  controlador.reativar,
)
rotas.get('/:id', ...soGestor, validate({ params: parametroId }), controlador.buscarPorId)
rotas.put(
  '/:id',
  ...soGestor,
  validate({ params: parametroId, body: corpoDeAtualizacao }),
  controlador.atualizar,
)
rotas.delete('/:id', ...soGestor, validate({ params: parametroId }), controlador.inativar)
