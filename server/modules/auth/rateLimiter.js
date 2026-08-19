import rateLimit from 'express-rate-limit'
import { AppError } from '../../shared/AppError.js'

export const limitadorDeLogin = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // Limita a 5 tentativas por janela
  keyGenerator: (req) => {
    // Segue o requisito de 5 tentativas por e-mail. Cai para constante 'unknown' caso nao tenha email, evitando warnings do ipv6.
    const email = req.body?.email?.trim()?.toLowerCase()
    return email || 'unknown'
  },
  handler: (_req, _res, next) => {
    next(new AppError('MUITAS_TENTATIVAS', 'Muitas tentativas de login. Tente novamente em alguns minutos.'))
  },
})
