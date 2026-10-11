import { Router } from 'express'

import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { corpoComEndpoint, corpoDaInscricao } from './schema.js'

export const rotas = Router()

// Qualquer papel pode ligar os alertas no proprio celular; o envio decide quem recebe.
rotas.get('/chave-publica', requireAuth, controlador.chavePublica)
rotas.get('/inscricoes', requireAuth, controlador.listar)
rotas.put('/inscricoes', requireAuth, validate({ body: corpoDaInscricao }), controlador.salvar)
rotas.delete('/inscricoes', requireAuth, validate({ body: corpoComEndpoint }), controlador.remover)
rotas.post('/teste', requireAuth, validate({ body: corpoComEndpoint }), controlador.testar)
