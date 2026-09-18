import * as servico from './service.js'

export async function resumo(req, res) {
  res.json({ dados: await servico.obterResumo(req.validado.query) })
}

export async function ranking(req, res) {
  res.json({ dados: await servico.obterRanking(req.validado.query) })
}
