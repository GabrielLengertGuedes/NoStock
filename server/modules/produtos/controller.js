import * as servico from './service.js'

export async function listar(req, res) {
  res.json(await servico.listar(req.validado.query))
}
