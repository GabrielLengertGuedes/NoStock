import bcrypt from 'bcrypt'
import { buscarPorEmailPeloLogin, buscarPorId } from '../usuarios/repository.js'
import { AppError } from '../../shared/AppError.js'

export async function login(email, senha) {
  const usuario = await buscarPorEmailPeloLogin(email)
  
  if (!usuario) {
    throw new AppError('NAO_AUTENTICADO', 'Credenciais inválidas')
  }
  
  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) {
    throw new AppError('NAO_AUTENTICADO', 'Credenciais inválidas')
  }
  
  if (!usuario.ativo) {
    throw new AppError('SEM_PERMISSAO', 'Usuário bloqueado') // Usando 403 ou 401, a task pede usuário bloqueado
  }
  
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel
  }
}

export async function me(id) {
  const usuario = await buscarPorId(id)
  
  if (!usuario || !usuario.ativo) {
    throw new AppError('NAO_AUTENTICADO', 'Sessão inválida ou usuário inativo')
  }
  
  return usuario
}
