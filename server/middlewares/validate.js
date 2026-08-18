import { z } from 'zod'

import { AppError } from '../shared/AppError.js'

// Mensagem padrao do zod em portugues, para o schema que nao trouxer a sua.
z.config(z.locales.pt())

function campos(erroZod) {
  const saida = {}
  for (const problema of erroZod.issues) {
    const caminho = problema.path.join('.') || '_'
    saida[caminho] ??= problema.message
  }
  return saida
}

// Recebe schemas zod por parte da requisicao. O resultado validado fica em
// req.validado, porque no Express 5 o req.query e somente leitura.
export function validate(schemas) {
  return (req, _res, next) => {
    req.validado ??= {}

    for (const [parte, schema] of Object.entries(schemas)) {
      const resultado = schema.safeParse(req[parte])

      if (!resultado.success) {
        return next(new AppError('VALIDACAO', 'Dados inválidos.', campos(resultado.error)))
      }
      req.validado[parte] = resultado.data
    }

    next()
  }
}
