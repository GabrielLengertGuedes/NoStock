import { Router } from 'express'

import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import * as controlador from './controller.js'
import { filtrosDeCategorias, filtrosDeGiro, filtrosDeRanking, filtrosDeResumo } from './schema.js'

export const rotas = Router()

// Relatorios expoem receita e desempenho de vendas: acesso restrito a gestor.
const soGestor = [requireAuth, requireRole('GESTOR')]

rotas.get('/resumo', ...soGestor, validate({ query: filtrosDeResumo }), controlador.resumo)
rotas.get('/ranking', ...soGestor, validate({ query: filtrosDeRanking }), controlador.ranking)
rotas.get(
  '/categorias',
  ...soGestor,
  validate({ query: filtrosDeCategorias }),
  controlador.categorias,
)
rotas.get('/giro', ...soGestor, validate({ query: filtrosDeGiro }), controlador.giro)
