import 'dotenv/config'

const DEFINICOES = {
  NODE_ENV: { padrao: 'development' },
  PORT: { padrao: '3001', numero: true },
  DATABASE_URL: { obrigatoria: true },
  SESSION_SECRET: { obrigatoria: true },
  SESSION_MAX_AGE_HOURS: { padrao: '8', numero: true },
  CORS_ORIGIN: { padrao: 'http://localhost:5173' },
  BCRYPT_ROUNDS: { padrao: '12', numero: true },
}

export class EnvInvalido extends Error {
  constructor(mensagem) {
    super(mensagem)
    this.name = 'EnvInvalido'
  }
}

// Junta todos os problemas antes de reclamar, em vez de um por execucao.
export function lerEnv(fonte = process.env) {
  const ausentes = []
  const invalidas = []
  const bruto = {}

  for (const [nome, definicao] of Object.entries(DEFINICOES)) {
    const valor = fonte[nome]?.trim() || definicao.padrao

    if (!valor) {
      ausentes.push(nome)
      continue
    }
    if (definicao.numero && !(Number.isInteger(Number(valor)) && Number(valor) > 0)) {
      invalidas.push(`${nome} precisa ser um número inteiro positivo (recebeu "${valor}")`)
      continue
    }
    bruto[nome] = definicao.numero ? Number(valor) : valor
  }

  if (ausentes.length > 0 || invalidas.length > 0) {
    const partes = ['A API não subiu.']
    if (ausentes.length > 0) {
      partes.push(`Faltando no .env: ${ausentes.join(', ')}.`)
    }
    if (invalidas.length > 0) {
      partes.push(`${invalidas.join('; ')}.`)
    }
    throw new EnvInvalido(partes.join(' '))
  }

  return Object.freeze({
    nodeEnv: bruto.NODE_ENV,
    porta: bruto.PORT,
    databaseUrl: bruto.DATABASE_URL,
    sessionSecret: bruto.SESSION_SECRET,
    sessionMaxAgeHoras: bruto.SESSION_MAX_AGE_HOURS,
    corsOrigin: bruto.CORS_ORIGIN,
    bcryptRounds: bruto.BCRYPT_ROUNDS,
    producao: bruto.NODE_ENV === 'production',
  })
}

let cache = null

export function obterEnv() {
  cache ??= lerEnv()
  return cache
}
