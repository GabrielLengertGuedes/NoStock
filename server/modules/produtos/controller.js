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
