import { describe, expect, it } from 'vitest'

import { validarDestinoE2E } from '../../scripts/e2e/database.js'

describe('destino exclusivo dos E2E', () => {
  it.each([undefined, '', 'invalida', 'https://localhost/nostock_e2e',
    'postgresql://db.exemplo.com/nostock_e2e', 'postgresql://localhost/postgres',
    'postgresql://localhost/nostock_e2e?host=db.exemplo.com',
    'postgresql://localhost/nostock_e2e#outro'])('recusa %s sem conectar', (url) => {
    expect(() => validarDestinoE2E(url)).toThrow(/E2E/)
  })

  it.each(['localhost', '127.0.0.1', '[::1]'])('aceita somente base dedicada em %s', (host) => {
    expect(validarDestinoE2E(`postgresql://${host}:55432/nostock_e2e`).pathname).toBe('/nostock_e2e')
  })
})
