import * as servico from './service.js'

export async function listar(req, res) {
  res.json(await servico.listar(req.validado.query))
}

export async function criar(req, res) {
  const produto = await servico.criar({
    ...req.validado.body,
    usuarioId: req.session.usuarioId,
  })
  res.status(201).json({ dados: produto })
}

export async function atualizar(req, res) {
  res.json({ dados: await servico.atualizar(req.validado.params.id, req.validado.body) })
}

export async function inativar(req, res) {
  await servico.inativar(req.validado.params.id)
  res.status(204).end()
}

export async function reativar(req, res) {
  await servico.reativar(req.validado.params.id)
  res.status(204).end()
}
