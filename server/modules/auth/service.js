import bcrypt from 'bcrypt'

import { obterEnv } from '../../config/env.js'
import { AppError } from '../../shared/AppError.js'
import {
  atualizarSenha,
  buscarCredenciaisPorId,
  buscarPorEmailPeloLogin,
  buscarPorId,
  encerrarSessoes,
} from '../usuarios/repository.js'

const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha inválidos'

// E-mail inexistente tambem paga um bcrypt: sem isso ele respondia na hora e
// o tempo de resposta dizia quais e-mails tem conta. Gerado uma vez, no custo
// configurado, para levar o mesmo tempo de uma senha de verdade.
let hashFicticio = null

async function compararComHashFicticio(senha) {
  hashFicticio ??= await bcrypt.hash('nostock-usuario-inexistente', obterEnv().bcryptRounds)
  await bcrypt.compare(senha, hashFicticio)
}

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
    await compararComHashFicticio(senha)
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

// Quem troca a senha derruba as outras sessoes abertas (o PC do balcao que
// ficou logado, por exemplo) e continua na atual.
export async function alterarSenha(id, senhaAtual, senhaNova, { sessaoAtual = null } = {}) {
  const usuario = await buscarCredenciaisPorId(id)

  if (!usuario || !usuario.ativo) {
    throw new AppError('NAO_AUTENTICADO', 'Sessão expirada ou não encontrada.')
  }

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash)
  if (!senhaValida) {
    throw new AppError('REGRA_NEGOCIO', 'A senha atual não confere.')
  }

  await atualizarSenha(id, await bcrypt.hash(senhaNova, obterEnv().bcryptRounds))
  await encerrarSessoes(id, { exceto: sessaoAtual })
}
