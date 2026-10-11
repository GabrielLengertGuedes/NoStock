import { describe, expect, it } from 'vitest'

import { mascararCnpj } from '../../src/lib/cnpj.js'

describe('mascararCnpj', () => {
  it('formata enquanto a pessoa digita', () => {
    expect(mascararCnpj('19')).toBe('19')
    expect(mascararCnpj('199')).toBe('19.9')
    expect(mascararCnpj('19980203')).toBe('19.980.203')
    expect(mascararCnpj('199802030')).toBe('19.980.203/0')
    expect(mascararCnpj('1998020300011')).toBe('19.980.203/0001-1')
    expect(mascararCnpj('19980203000110')).toBe('19.980.203/0001-10')
  })

  it('não trava o backspace num separador', () => {
    expect(mascararCnpj('19.980.203/')).toBe('19.980.203')
  })

  it('aceita colado já formatado e ignora o que passa de 14 dígitos', () => {
    expect(mascararCnpj('19.980.203/0001-10')).toBe('19.980.203/0001-10')
    expect(mascararCnpj('19.980.203/0001-109')).toBe('19.980.203/0001-10')
  })

  it('devolve vazio para cadastro sem CNPJ', () => {
    expect(mascararCnpj(null)).toBe('')
  })
})
