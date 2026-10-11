import { describe, expect, it } from 'vitest'

import { formatarTelefone, linkWhatsapp, mascararTelefone } from '../../src/lib/telefone.js'

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

describe('mascararTelefone', () => {
  it('formata enquanto a pessoa digita', () => {
    expect(mascararTelefone('4')).toBe('(4')
    expect(mascararTelefone('47')).toBe('(47')
    expect(mascararTelefone('479')).toBe('(47) 9')
    expect(mascararTelefone('4799999')).toBe('(47) 9999-9')
    expect(mascararTelefone('4733334444')).toBe('(47) 3333-4444')
    expect(mascararTelefone('47999998888')).toBe('(47) 99999-8888')
  })

  it('não trava o backspace num separador', () => {
    // "(47) 9" com o 9 apagado vira "(47) ", que precisa seguir encolhendo
    expect(mascararTelefone('(47) ')).toBe('(47')
    expect(mascararTelefone('(47) 9999-')).toBe('(47) 9999')
  })

  it('ignora o que passa de 11 dígitos', () => {
    expect(mascararTelefone('(47) 99999-88881')).toBe('(47) 99999-8888')
  })

  it('tira o 55 de quem cola com +55, mas não de um DDD 55', () => {
    expect(mascararTelefone('+55 (47) 99999-8888')).toBe('(47) 99999-8888')
    expect(mascararTelefone('55999998888')).toBe('(55) 99999-8888')
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
