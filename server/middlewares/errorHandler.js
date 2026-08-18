import { AppError } from '../shared/AppError.js'

export function errorHandler(erro, req, res, _next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.campos ? { campos: erro.campos } : {}),
      },
    })
  }

  if (erro?.type === 'entity.parse.failed') {
    return res.status(422).json({
      erro: { codigo: 'VALIDACAO', mensagem: 'Corpo da requisição não é um JSON válido.' },
    })
  }

  // O detalhe fica no log do servidor; o cliente nunca recebe stack trace.
  console.error(`Erro em ${req.method} ${req.originalUrl}:`, erro)

  res.status(500).json({
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro inesperado. Tente de novo.' },
  })
}
