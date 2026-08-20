import { AppError } from '../shared/AppError.js'

export function requireAuth(req, _res, next) {
  if (!req.session || !req.session.usuarioId) {
    throw new AppError('NAO_AUTENTICADO', 'Sessão expirada ou não encontrada.')
  }
  next()
}

export function requireRole(papelRequerido) {
  return (req, _res, next) => {
    if (!req.session || !req.session.usuarioId) {
      throw new AppError('NAO_AUTENTICADO', 'Sessão expirada ou não encontrada.')
    }

    if (req.session.papel !== papelRequerido) {
      throw new AppError('SEM_PERMISSAO', 'Acesso restrito a gestores.')
    }

    next()
  }
}
