import { describe, expect, it } from 'vitest'

import { validarLogin } from '../../src/lib/validarLogin.js'

describe('validarLogin', () => {
  it('aceita e-mail e senha preenchidos', () => {
    expect(validarLogin({ email: ' maria@bioma.com.br ', senha: 'x' })).toEqual({})
  })

  it('pede os dois campos quando vazios', () => {
    expect(validarLogin({ email: '   ', senha: '' })).toEqual({
      email: 'Informe o e-mail.',
      senha: 'Informe a senha.',
    })
  })

  it('recusa e-mail sem formato válido', () => {
    expect(validarLogin({ email: 'maria@bioma', senha: 'x' }).email).toBe(
      'E-mail inválido. Confira o endereço.',
    )
  })
})
