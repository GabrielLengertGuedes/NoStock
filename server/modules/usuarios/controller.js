import * as servico from './service.js'

export async function listar(req, res) {
  res.json({ dados: await servico.listar(req.validado.query) })
}

export async function buscarPorId(req, res) {
  res.json({ dados: await servico.buscarPorId(req.validado.params.id) })
}

export async function criar(req, res) {
  res.status(201).json({ dados: await servico.criar(req.validado.body) })
}

export async function atualizar(req, res) {
  res.json({ dados: await servico.atualizar(req.validado.params.id, req.validado.body) })
}

export async function redefinirSenha(req, res) {
  await servico.redefinirSenha(req.validado.params.id, req.validado.body.senhaNova)
  res.status(204).end()
}

export async function inativar(req, res) {
  await servico.inativar(req.validado.params.id)
  res.status(204).end()
}

export async function reativar(req, res) {
  await servico.reativar(req.validado.params.id)
  res.status(204).end()
}
