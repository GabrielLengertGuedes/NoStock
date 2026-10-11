import { describe, expect, it } from 'vitest'

import { formatarTelefone, linkWhatsapp } from '../../src/lib/telefone.js'

describe('formatarTelefone', () => {
  it('formata celular e fixo com DDD', () => {
    expect(formatarTelefone('47999998888')).toBe('(47) 99999-8888')
    expect(formatarTelefone('4733334444')).toBe('(47) 3333-4444')
  })

  it('aceita cadastro antigo já formatado ou com o 55 do país', () => {
    expect(formatarTelefone('+55 47 99999-8888')).toBe('(47) 99999-8888')
  })

  it('devolve como veio o que não reconhece', () => {
    expect(formatarTelefone('ramal 12')).toBe('ramal 12')
    expect(formatarTelefone(null)).toBe('')
  })
})

describe('linkWhatsapp', () => {
  it('abre a conversa com o 55 na frente', () => {
    expect(linkWhatsapp('47999998888')).toBe('https://wa.me/5547999998888')
    expect(linkWhatsapp('(47) 99999-8888')).toBe('https://wa.me/5547999998888')
    expect(linkWhatsapp('+55 47 99999-8888')).toBe('https://wa.me/5547999998888')
  })

  it('não gera link sem DDD', () => {
    expect(linkWhatsapp('99998888')).toBeNull()
    expect(linkWhatsapp(null)).toBeNull()
  })
})
