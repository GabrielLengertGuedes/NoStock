import { describe, expect, it } from 'vitest'

describe('isolamento da suíte normal', () => {
  it('nunca usa o banco remoto configurado para desenvolvimento', () => {
    const url = new URL(process.env.DATABASE_URL)
    expect(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)).toBe(true)
    expect(url.pathname).toBe('/nostock_test')
  })

  it('mantém notificações externas desligadas', () => {
    expect(process.env.VAPID_PUBLIC_KEY).toBe('')
    expect(process.env.VAPID_PRIVATE_KEY).toBe('')
    expect(process.env.VAPID_SUBJECT).toBe('')
  })
})
