import axios from 'axios'

export class ErroApi extends Error {
  constructor({ codigo, mensagem, campos = null, status = 0 }) {
    super(mensagem)
    this.name = 'ErroApi'
    this.codigo = codigo
    this.campos = campos
    this.status = status
  }
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15_000,
})

// A API responde { dados, meta } no sucesso e { erro } na falha. O sucesso ja
// chega desembrulhado; a falha vira ErroApi, com o codigo e os campos.
api.interceptors.response.use(
  (resposta) => resposta.data,
  (falha) => {
    if (!falha.response) {
      throw new ErroApi({
        codigo: 'SEM_RESPOSTA',
        mensagem: 'Não foi possível falar com o servidor. Verifique sua conexão.',
      })
    }

    const erro = falha.response.data?.erro
    throw new ErroApi({
      codigo: erro?.codigo ?? 'ERRO_INTERNO',
      mensagem: erro?.mensagem ?? 'Erro inesperado. Tente de novo.',
      campos: erro?.campos ?? null,
      status: falha.response.status,
    })
  },
)
