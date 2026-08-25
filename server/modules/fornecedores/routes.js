import { Router } from 'express'

import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import {
  corpoDeAtualizacao,
  corpoDeCriacao,
  filtrosDeListagem,
  parametroId,
} from './schema.js'

export const rotas = Router()

rotas.get('/', validate({ query: filtrosDeListagem }), controlador.listar)
rotas.post('/', validate({ body: corpoDeCriacao }), controlador.criar)
rotas.get('/:id', validate({ params: parametroId }), controlador.buscarPorId)
rotas.put('/:id', validate({ params: parametroId, body: corpoDeAtualizacao }), controlador.atualizar)
rotas.delete('/:id', validate({ params: parametroId }), controlador.inativar)
