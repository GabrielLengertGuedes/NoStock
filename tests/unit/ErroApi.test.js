import { describe, expect, it } from 'vitest'

import { ErroApi } from '../../src/api/client.js'

describe('ErroApi', () => {
  it('expõe a mensagem em .mensagem, que é o campo lido pelas telas', () => {
    const erro = new ErroApi({ codigo: 'NAO_AUTENTICADO', mensagem: 'E-mail ou senha inválidos' })

    expect(erro.mensagem).toBe('E-mail ou senha inválidos')
    expect(erro.message).toBe('E-mail ou senha inválidos')
    expect(erro.codigo).toBe('NAO_AUTENTICADO')
  })
})
