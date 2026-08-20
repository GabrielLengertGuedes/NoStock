import rateLimit, { MemoryStore } from 'express-rate-limit'

import { AppError } from '../../shared/AppError.js'

const JANELA_MS = 10 * 60 * 1000
const BLOQUEIO_MS = 5 * 60 * 1000
const MAX_TENTATIVAS = 5
const MENSAGEM_BLOQUEIO = 'Muitas tentativas de login. Tente novamente em 5 minutos.'

const armazenamento = new MemoryStore()
const bloqueadoAtePorEmail = new Map()

function emailDoLogin(req) {
  const email = req.body?.email
  if (typeof email !== 'string') return null
  const normalizado = email.trim().toLowerCase()
  return normalizado || null
}

function recusarPorExcesso(_req, _res, next) {
  next(new AppError('MUITAS_TENTATIVAS', MENSAGEM_BLOQUEIO))
}

export function recusarSeBloqueado(req, _res, next) {
  const email = emailDoLogin(req)
  if (!email) return next()

  const ate = bloqueadoAtePorEmail.get(email)
  if (ate && Date.now() < ate) {
    return recusarPorExcesso(req, _res, next)
  }

  if (ate) bloqueadoAtePorEmail.delete(email)
  next()
}

export const limitadorDeLogin = rateLimit({
  windowMs: JANELA_MS,
  limit: MAX_TENTATIVAS,
  store: armazenamento,
  skipSuccessfulRequests: true,
  validate: { keyGeneratorIpFallback: false },
  skip: (req) => !emailDoLogin(req),
  keyGenerator: (req) => emailDoLogin(req),
  handler: (req, res, next) => {
    const email = emailDoLogin(req)
    if (email) {
      bloqueadoAtePorEmail.set(email, Date.now() + BLOQUEIO_MS)
      void armazenamento.resetKey(email)
    }
    recusarPorExcesso(req, res, next)
  },
})

export async function resetarLimitadorDeLogin() {
  bloqueadoAtePorEmail.clear()
  await armazenamento.resetAll()
}
