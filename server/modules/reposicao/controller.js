import * as servico from './service.js'

export async function listar(req, res) {
  res.json({ dados: await servico.obterReposicao(req.validado.query) })
}
