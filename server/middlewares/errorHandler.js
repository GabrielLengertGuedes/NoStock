import { AppError } from '../shared/AppError.js'

// Erros do Postgres que sao culpa do pedido, nao do servidor. Os servicos ja
// validam o caso comum; isto cobre o que escapa (corrida entre duas
// requisicoes, numero que estoura a coluna) para nao virar 500.
const ERROS_DO_BANCO = {
  23503: () => new AppError('VALIDACAO', 'Um dos registros informados não existe.'),
  23505: () => new AppError('CONFLITO', 'Já existe um registro com esses dados.'),
  23514: () => new AppError('VALIDACAO', 'Os dados violam uma regra do cadastro.'),
  22003: () => new AppError('VALIDACAO', 'Valor numérico fora do limite permitido.'),
  // lock_timeout (5 s em emTransacao), deadlock e conflito de serializacao.
  '55P03': () => new AppError('CONFLITO', 'O registro está ocupado por outra operação. Tente de novo.'),
  '40P01': () => new AppError('CONFLITO', 'O registro está ocupado por outra operação. Tente de novo.'),
  40001: () => new AppError('CONFLITO', 'O registro está ocupado por outra operação. Tente de novo.'),
}

function responder(res, erro) {
  return res.status(erro.status).json({
    erro: {
      codigo: erro.codigo,
      mensagem: erro.message,
      ...(erro.campos ? { campos: erro.campos } : {}),
    },
  })
}

// O detail do pg traz o valor que causou o erro (e-mail, CNPJ) e a query string
// traz o que foi buscado: nenhum dos dois vai para o log.
function registrar(req, erro) {
  const rota = `${req.method} ${req.originalUrl.split('?')[0]}`

  if (typeof erro?.code === 'string' && erro.code.length === 5) {
    console.error(`Erro do banco em ${rota}:`, {
      codigo: erro.code,
      restricao: erro.constraint,
      mensagem: erro.message,
    })
    return
  }

  console.error(`Erro em ${rota}:`, erro)
}

export function errorHandler(erro, req, res, _next) {
  if (erro instanceof AppError) return responder(res, erro)

  if (erro?.type === 'entity.parse.failed') {
    return res.status(422).json({
      erro: { codigo: 'VALIDACAO', mensagem: 'Corpo da requisição não é um JSON válido.' },
    })
  }

  registrar(req, erro)

  const traduzido = ERROS_DO_BANCO[erro?.code]
  if (traduzido) return responder(res, traduzido())

  // O cliente nunca recebe stack trace nem mensagem do banco.
  res.status(500).json({
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro inesperado. Tente de novo.' },
  })
}
