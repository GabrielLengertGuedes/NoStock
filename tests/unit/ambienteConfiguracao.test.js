import { describe, expect, it } from 'vitest'

import { ambienteDeTeste } from '../../scripts/tests/ambiente.js'

describe('configuração obrigatória de banco de testes', () => {
  it.each([undefined, {}, { url: 'postgresql://localhost/nostock_test' },
    { url: 'postgresql://db.example.com/nostock_test', segredo: 'apenas-teste' },
    { url: 'postgresql://localhost/postgres', segredo: 'apenas-teste' },
    { url: 'postgresql://localhost/nostock_test?host=db.example.com', segredo: 'apenas-teste' },
    { url: 'https://localhost/nostock_test', segredo: 'apenas-teste' },
    { url: 'postgresql://localhost/nostock_test#outro', segredo: 'apenas-teste' }])('recusa contexto inválido %j antes de conectar', (contexto) => {
    expect(() => ambienteDeTeste(contexto)).toThrow(/banco temporário/i)
  })

  it.each(['localhost', '127.0.0.1', '[::1]'])('gera somente configuração local para %s', (host) => {
    const url = `postgresql://${host}:55432/nostock_test`
    const ambiente = ambienteDeTeste({ url, segredo: 'apenas-teste' })
    expect(ambiente.DATABASE_URL).toBe(url)
    expect(ambiente.NODE_ENV).toBe('test')
    expect(ambiente.DATABASE_CA_CERT).toBe('')
    expect(ambiente.VAPID_PUBLIC_KEY).toBe('')
    expect(ambiente.VAPID_PRIVATE_KEY).toBe('')
    expect(ambiente.VAPID_SUBJECT).toBe('')
  })
})
