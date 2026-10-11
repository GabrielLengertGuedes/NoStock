import * as servico from './service.js'

// O dono da inscricao vem sempre da sessao, nunca do corpo da requisicao.
export function chavePublica(_req, res) {
  res.json({ dados: servico.chavePublica() })
}

export async function listar(req, res) {
  res.json({ dados: await servico.listar(req.usuario.id) })
}

export async function salvar(req, res) {
  res.json({ dados: await servico.salvar(req.usuario.id, req.validado.body) })
}

export async function remover(req, res) {
  await servico.remover(req.usuario.id, req.validado.body.endpoint)
  res.status(204).end()
}

export async function testar(req, res) {
  await servico.testar(req.usuario.id, req.validado.body.endpoint)
  res.status(204).end()
}
