import { describe, expect, it } from 'vitest'

import { EnvInvalido, lerEnv } from '../../server/config/env.js'

const BASE = { DATABASE_URL: 'postgres://usuario:senha@host/banco', SESSION_SECRET: 'segredo' }

describe('variáveis VAPID', () => {
  it('sem as chaves, a API sobe com o push desligado', () => {
    expect(lerEnv(BASE).vapid).toBeNull()
    expect(lerEnv({ ...BASE, VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: ' ', VAPID_SUBJECT: '' }).vapid).toBeNull()
  })

  it('com as três, o push fica configurado', () => {
    const env = lerEnv({
      ...BASE,
      VAPID_PUBLIC_KEY: 'publica',
      VAPID_PRIVATE_KEY: 'privada',
      VAPID_SUBJECT: 'mailto:loja@exemplo.com',
    })

    expect(env.vapid).toEqual({ chavePublica: 'publica', chavePrivada: 'privada', contato: 'mailto:loja@exemplo.com' })
  })

  it('recusa subir com só parte das chaves', () => {
    expect(() => lerEnv({ ...BASE, VAPID_PUBLIC_KEY: 'publica' })).toThrow(EnvInvalido)
    expect(() => lerEnv({ ...BASE, VAPID_PUBLIC_KEY: 'publica' })).toThrow(/preencha as três ou nenhuma/)
  })

  it('recusa contato que não seja mailto: ou https://', () => {
    expect(() =>
      lerEnv({ ...BASE, VAPID_PUBLIC_KEY: 'publica', VAPID_PRIVATE_KEY: 'privada', VAPID_SUBJECT: 'loja@exemplo.com' }),
    ).toThrow(/VAPID_SUBJECT precisa começar com mailto:/)
  })
})
