// Erro previsto pelo sistema. Qualquer outro erro vira ERRO_INTERNO na resposta.
const STATUS = {
  NAO_AUTENTICADO: 401,
  SEM_PERMISSAO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  NOME_DUPLICADO: 409,
  VALIDACAO: 422,
  SALDO_INSUFICIENTE: 400,
  REGRA_NEGOCIO: 400,
  MUITAS_TENTATIVAS: 429,
  ERRO_INTERNO: 500,
}

export class AppError extends Error {
  constructor(codigo, mensagem, campos = null) {
    super(mensagem)
    this.name = 'AppError'
    this.codigo = codigo
    this.status = STATUS[codigo] ?? 500
    this.campos = campos
  }
}

export const CODIGOS = Object.freeze(Object.keys(STATUS))
