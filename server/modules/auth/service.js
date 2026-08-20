import bcrypt from 'bcrypt'

import { AppError } from '../../shared/AppError.js'
import { buscarPorEmailPeloLogin, buscarPorId } from '../usuarios/repository.js'

const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha inválidos'

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  }
}

export async function login(email, senha) {
  const usuario = await buscarPorEmailPeloLogin(email)

  if (!usuario) {
    throw new AppError('NAO_AUTENTICADO', MENSAGEM_LOGIN_INVALIDO)
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida || !usuario.ativo) {
    throw new AppError('NAO_AUTENTICADO', MENSAGEM_LOGIN_INVALIDO)
  }

  return usuarioPublico(usuario)
}

export async function me(id) {
  const usuario = await buscarPorId(id)

  if (!usuario || !usuario.ativo) {
    throw new AppError('NAO_AUTENTICADO', 'Sessão expirada ou não encontrada.')
  }

  return usuarioPublico(usuario)
}
