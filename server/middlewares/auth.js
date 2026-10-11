import { buscarPorId } from '../modules/usuarios/repository.js'
import { AppError } from '../shared/AppError.js'

const sessaoInvalida = () => new AppError('NAO_AUTENTICADO', 'Sessão expirada ou não encontrada.')

function destruirSessao(req) {
  return new Promise((resolve) => {
    req.session.destroy(() => resolve())
  })
}

// Papel e situacao saem do banco a cada request, nunca do que a sessao guardou
// no login: quem foi inativado ou rebaixado perde o acesso na hora, e nao so
// quando a sessao expirar (com rolling, ela nao expira enquanto houver uso).
async function usuarioDaSessao(req) {
  if (req.usuario) return req.usuario

  const usuarioId = req.session?.usuarioId
  if (!usuarioId) throw sessaoInvalida()

  const usuario = await buscarPorId(usuarioId)
  if (!usuario?.ativo) {
    await destruirSessao(req)
    throw sessaoInvalida()
  }

  req.usuario = usuario
  return usuario
}

export async function requireAuth(req, _res, next) {
  await usuarioDaSessao(req)
  next()
}

export function requireRole(papelRequerido) {
  return async (req, _res, next) => {
    const usuario = await usuarioDaSessao(req)

    if (usuario.papel !== papelRequerido) {
      throw new AppError('SEM_PERMISSAO', 'Acesso restrito a gestores.')
    }

    next()
  }
}
