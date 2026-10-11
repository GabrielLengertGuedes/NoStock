import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit'

import { AppError } from '../../shared/AppError.js'

const JANELA_MS = 10 * 60 * 1000
const BLOQUEIO_MS = 5 * 60 * 1000
const MAX_TENTATIVAS = 5
// Teto por IP somando todos os e-mails: segura quem testa senhas comuns contra
// varias contas. Folgado o bastante para a loja inteira sair pelo mesmo IP.
const MAX_FALHAS_POR_IP = 30
const MENSAGEM_BLOQUEIO = 'Muitas tentativas de login. Tente novamente em 5 minutos.'

// MemoryStore vale por processo: com mais de uma replica, cada uma conta a sua.
const armazenamento = new MemoryStore()
const armazenamentoPorIp = new MemoryStore()
const bloqueadoAte = new Map()

function emailDoLogin(req) {
  const email = req.body?.email
  if (typeof email !== 'string') return null
  const normalizado = email.trim().toLowerCase()
  return normalizado || null
}

// O bloqueio e por IP + e-mail: chave so por e-mail deixava qualquer um, de
// qualquer lugar, travar a conta do gestor errando a senha dele de proposito.
function chaveDoLogin(req) {
  const email = emailDoLogin(req)
  return email ? `${ipKeyGenerator(req.ip)}|${email}` : null
}

// Sem isto o Map so perdia uma chave quando o mesmo IP + e-mail voltava, e
// tentativas com e-mails aleatorios faziam ele crescer sem fim.
function descartarBloqueiosVencidos(agora) {
  for (const [chave, ate] of bloqueadoAte) {
    if (ate <= agora) bloqueadoAte.delete(chave)
  }
}

function recusarPorExcesso(_req, _res, next) {
  next(new AppError('MUITAS_TENTATIVAS', MENSAGEM_BLOQUEIO))
}

export function recusarSeBloqueado(req, _res, next) {
  const chave = chaveDoLogin(req)
  if (!chave) return next()

  const ate = bloqueadoAte.get(chave)
  if (ate && Date.now() < ate) {
    return recusarPorExcesso(req, _res, next)
  }

  if (ate) bloqueadoAte.delete(chave)
  next()
}

// So credencial errada (401) conta. Os 429 do bloqueio e os 422 de validacao
// ficam de fora: senao um funcionario clicando em "Entrar" enquanto esta
// bloqueado somava falhas ao IP e travava o login da loja inteira.
export const limitadorPorIp = rateLimit({
  windowMs: JANELA_MS,
  limit: MAX_FALHAS_POR_IP,
  store: armazenamentoPorIp,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  handler: recusarPorExcesso,
})

export const limitadorDeLogin = rateLimit({
  windowMs: JANELA_MS,
  limit: MAX_TENTATIVAS,
  store: armazenamento,
  skipSuccessfulRequests: true,
  skip: (req) => !chaveDoLogin(req),
  keyGenerator: (req) => chaveDoLogin(req),
  handler: (req, res, next) => {
    const chave = chaveDoLogin(req)
    if (chave) {
      const agora = Date.now()
      descartarBloqueiosVencidos(agora)
      bloqueadoAte.set(chave, agora + BLOQUEIO_MS)
      void armazenamento.resetKey(chave)
    }
    recusarPorExcesso(req, res, next)
  },
})

export async function resetarLimitadorDeLogin() {
  bloqueadoAte.clear()
  await armazenamento.resetAll()
  await armazenamentoPorIp.resetAll()
}
