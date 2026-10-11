import 'dotenv/config'

const DEFINICOES = {
  NODE_ENV: { padrao: 'development' },
  PORT: { padrao: '3001', numero: true },
  DATABASE_URL: { obrigatoria: true },
  SESSION_SECRET: { obrigatoria: true },
  SESSION_MAX_AGE_HOURS: { padrao: '8', numero: true },
  CORS_ORIGIN: { padrao: 'http://localhost:5173' },
  BCRYPT_ROUNDS: { padrao: '12', numero: true },
  // Fuso da loja/cliente: decide o "hoje" dos cards do dashboard (RF do fuso horário).
  FUSO_HORARIO: { padrao: 'America/Sao_Paulo' },
  // Alertas push (Web Push com VAPID). As tres vao juntas ou nenhuma: sem elas a
  // API sobe com o push desligado. O par sai de `npx web-push generate-vapid-keys`.
  VAPID_PUBLIC_KEY: { opcional: true },
  VAPID_PRIVATE_KEY: { opcional: true },
  VAPID_SUBJECT: { opcional: true },
}

const VAPID = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']

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
      if (definicao.opcional) bruto[nome] = null
      else ausentes.push(nome)
      continue
    }
    if (definicao.numero && !(Number.isInteger(Number(valor)) && Number(valor) > 0)) {
      invalidas.push(`${nome} precisa ser um número inteiro positivo (recebeu "${valor}")`)
      continue
    }
    bruto[nome] = definicao.numero ? Number(valor) : valor
  }

  const vapidPreenchidas = VAPID.filter((nome) => bruto[nome])
  if (vapidPreenchidas.length > 0 && vapidPreenchidas.length < VAPID.length) {
    invalidas.push(`${VAPID.join(', ')} vão juntas: preencha as três ou nenhuma`)
  } else if (bruto.VAPID_SUBJECT && !/^(mailto:|https:\/\/)/.test(bruto.VAPID_SUBJECT)) {
    invalidas.push(`VAPID_SUBJECT precisa começar com mailto: ou https:// (recebeu "${bruto.VAPID_SUBJECT}")`)
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
    fusoHorario: bruto.FUSO_HORARIO,
    vapid: bruto.VAPID_PUBLIC_KEY
      ? Object.freeze({
          chavePublica: bruto.VAPID_PUBLIC_KEY,
          chavePrivada: bruto.VAPID_PRIVATE_KEY,
          contato: bruto.VAPID_SUBJECT,
        })
      : null,
    producao: bruto.NODE_ENV === 'production',
  })
}

let cache = null

export function obterEnv() {
  cache ??= lerEnv()
  return cache
}
