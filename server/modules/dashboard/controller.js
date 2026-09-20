import * as servico from './service.js'

export async function obterResumo(req, res) {
  res.json({ dados: await servico.obterResumo() })
}
