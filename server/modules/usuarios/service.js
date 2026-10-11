import bcrypt from 'bcrypt'

import { obterEnv } from '../../config/env.js'
import { emTransacao } from '../../db/transaction.js'
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

// Roda dentro da transacao de quem vai inativar ou rebaixar: a contagem trava
// as linhas dos gestores ate o commit.
async function garantirNaoEUltimoGestor(usuario, conexao) {
  if (usuario.papel !== 'GESTOR') return

  const total = await repositorio.contarGestoresAtivosTravando(conexao)
  if (total <= 1) {
    throw new AppError(
      'REGRA_NEGOCIO',
      'Não é possível inativar nem rebaixar o último gestor ativo.',
    )
  }
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
  return emTransacao(async (conexao) => {
    const atual = await repositorio.buscarPorId(id, conexao)
    if (!atual) throw naoEncontrado()

    if (atual.papel === 'GESTOR' && dados.papel === 'OPERADOR') {
      await garantirNaoEUltimoGestor(atual, conexao)
    }

    try {
      const usuario = await repositorio.atualizar(id, dados, conexao)
      if (!usuario) throw naoEncontrado()
      return usuario
    } catch (erro) {
      throw conflitoDeEmail(erro, dados.email)
    }
  })
}

// Senha redefinida derruba as sessoes abertas com a senha antiga. sessaoAtual
// e a do gestor que pediu: se ele redefinir a propria, continua logado.
export async function redefinirSenha(id, senhaNova, { sessaoAtual = null } = {}) {
  const usuario = await repositorio.buscarPorId(id)
  if (!usuario) throw naoEncontrado()

  await repositorio.atualizarSenha(id, await hashDeSenha(senhaNova))
  await repositorio.encerrarSessoes(id, { exceto: sessaoAtual })
}

export async function inativar(id) {
  await emTransacao(async (conexao) => {
    const atual = await repositorio.buscarPorId(id, conexao)
    if (!atual) throw naoEncontrado()

    await garantirNaoEUltimoGestor(atual, conexao)

    const inativado = await repositorio.inativar(id, conexao)
    if (!inativado) throw new AppError('REGRA_NEGOCIO', 'Esse usuário já está inativo.')
  })
}

export async function reativar(id) {
  const reativado = await repositorio.reativar(id)
  if (reativado) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  throw new AppError('REGRA_NEGOCIO', 'Esse usuário já está ativo.')
}
