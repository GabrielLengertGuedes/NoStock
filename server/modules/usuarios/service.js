import bcrypt from 'bcrypt'

import { obterEnv } from '../../config/env.js'
import { AppError } from '../../shared/AppError.js'
import * as repositorio from './repository.js'

const VIOLACAO_DE_UNICIDADE = '23505'

const naoEncontrado = () => new AppError('NAO_ENCONTRADO', 'Usuário não encontrado.')

function conflitoDeEmail(erro, email) {
  return erro?.code === VIOLACAO_DE_UNICIDADE
    ? new AppError('CONFLITO', `Já existe um usuário com o e-mail "${email}".`, {
        email: 'Esse e-mail já está em uso',
      })
    : erro
}

async function hashDeSenha(senha) {
  return bcrypt.hash(senha, obterEnv().bcryptRounds)
}

function garantirNaoEUltimoGestor(usuario) {
  if (usuario.papel !== 'GESTOR') return Promise.resolve()

  return repositorio.contarGestoresAtivos().then((total) => {
    if (total <= 1) {
      throw new AppError(
        'REGRA_NEGOCIO',
        'Não é possível inativar nem rebaixar o último gestor ativo.',
      )
    }
  })
}

export function listar(filtros) {
  return repositorio.listar(filtros)
}

export async function buscarPorId(id) {
  const usuario = await repositorio.buscarPorId(id)
  if (!usuario) throw naoEncontrado()
  return usuario
}

export async function criar(dados) {
  try {
    return await repositorio.criar({
      nome: dados.nome,
      email: dados.email,
      senhaHash: await hashDeSenha(dados.senha),
      papel: dados.papel,
    })
  } catch (erro) {
    throw conflitoDeEmail(erro, dados.email)
  }
}

export async function atualizar(id, dados) {
  const atual = await repositorio.buscarPorId(id)
  if (!atual) throw naoEncontrado()

  if (atual.papel === 'GESTOR' && dados.papel === 'OPERADOR') {
    await garantirNaoEUltimoGestor(atual)
  }

  try {
    const usuario = await repositorio.atualizar(id, dados)
    if (!usuario) throw naoEncontrado()
    return usuario
  } catch (erro) {
    throw conflitoDeEmail(erro, dados.email)
  }
}

export async function redefinirSenha(id, senhaNova) {
  const usuario = await repositorio.buscarPorId(id)
  if (!usuario) throw naoEncontrado()

  await repositorio.atualizarSenha(id, await hashDeSenha(senhaNova))
}

export async function inativar(id) {
  const atual = await repositorio.buscarPorId(id)
  if (!atual) throw naoEncontrado()

  await garantirNaoEUltimoGestor(atual)

  const inativado = await repositorio.inativar(id)
  if (inativado) return

  throw new AppError('REGRA_NEGOCIO', 'Esse usuário já está inativo.')
}

export async function reativar(id) {
  const reativado = await repositorio.reativar(id)
  if (reativado) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  throw new AppError('REGRA_NEGOCIO', 'Esse usuário já está ativo.')
}
