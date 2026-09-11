import * as servico from './service.js'

export async function obter(req, res) {
  const dashboard = await servico.obterDashboard({ usuarioId: req.session?.usuarioId })
  res.json(dashboard)
}
