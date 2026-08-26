import { NOME_COOKIE_SESSAO } from '../../config/sessao.js'
import * as servico from './service.js'

function gravarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.save((erro) => (erro ? reject(erro) : resolve()))
  })
}

function renovarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => (erro ? reject(erro) : resolve()))
  })
}

export async function login(req, res, next) {
  try {
    const { email, senha } = req.validado.body
    const usuario = await servico.login(email, senha)

    await renovarSessao(req)
    req.session.usuarioId = usuario.id
    req.session.papel = usuario.papel
    await gravarSessao(req)

    res.status(200).json({ dados: usuario })
  } catch (erro) {
    next(erro)
  }
}

export function logout(req, res, next) {
  req.session.destroy((erro) => {
    if (erro) return next(erro)
    res.clearCookie(NOME_COOKIE_SESSAO, { path: '/' })
    res.status(204).end()
  })
}

export async function me(req, res, next) {
  try {
    const usuario = await servico.me(req.session.usuarioId)
    res.status(200).json({ dados: usuario })
  } catch (erro) {
    next(erro)
  }
}

export async function alterarSenha(req, res, next) {
  try {
    const { senhaAtual, senhaNova } = req.validado.body
    await servico.alterarSenha(req.session.usuarioId, senhaAtual, senhaNova)
    res.status(204).end()
  } catch (erro) {
    next(erro)
  }
}
