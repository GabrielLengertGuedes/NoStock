import { describe, expect, it } from 'vitest'

import { statusEstoque } from '../../server/shared/statusEstoque.js'

describe('statusEstoque', () => {
  it('reconhece os quatro estados', () => {
    expect(statusEstoque(0, 10)).toBe('SEM_ESTOQUE')
    expect(statusEstoque(3, 10)).toBe('CRITICO')
    expect(statusEstoque(8, 10)).toBe('BAIXO')
    expect(statusEstoque(20, 10)).toBe('NORMAL')
  })

  it('respeita o limite exato entre CRITICO e BAIXO com minimo par', () => {
    // minimo 10: metade e 5
    expect(statusEstoque(5, 10)).toBe('CRITICO')
    expect(statusEstoque(6, 10)).toBe('BAIXO')
  })

  it('arredonda a metade para cima com minimo impar', () => {
    // minimo 7: metade e 3,5 e o teto e 4
    expect(statusEstoque(4, 7)).toBe('CRITICO')
    expect(statusEstoque(5, 7)).toBe('BAIXO')
  })

  it('respeita o limite exato entre BAIXO e NORMAL', () => {
    expect(statusEstoque(10, 10)).toBe('BAIXO')
    expect(statusEstoque(11, 10)).toBe('NORMAL')
  })

  it('com minimo zero so existem SEM_ESTOQUE e NORMAL', () => {
    expect(statusEstoque(0, 0)).toBe('SEM_ESTOQUE')
    expect(statusEstoque(1, 0)).toBe('NORMAL')
    expect(statusEstoque(999, 0)).toBe('NORMAL')
  })

  it('com minimo um, BAIXO nao existe', () => {
    expect(statusEstoque(1, 1)).toBe('CRITICO')
    expect(statusEstoque(2, 1)).toBe('NORMAL')
  })

  it('saldo zero e SEM_ESTOQUE em qualquer minimo', () => {
    for (const minimo of [0, 1, 2, 7, 100]) {
      expect(statusEstoque(0, minimo)).toBe('SEM_ESTOQUE')
    }
  })
})
