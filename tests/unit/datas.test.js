import { describe, expect, it } from 'vitest'

import { dataPorExtenso, quando, rotuloDoDia, saudacao } from '../../src/lib/datas.js'

// Datas montadas no fuso de quem roda o teste, como o celular faria.
const agora = new Date(2026, 9, 10, 15, 6)
const iso = (...partes) => new Date(...partes).toISOString()

describe('datas do celular', () => {
  it('escreve o dia por extenso com a primeira letra maiúscula', () => {
    expect(dataPorExtenso(agora)).toBe('Sábado, 10 de outubro')
  })

  it('cumprimenta conforme a hora', () => {
    expect(saudacao(new Date(2026, 9, 10, 8))).toBe('Bom dia')
    expect(saudacao(agora)).toBe('Boa tarde')
    expect(saudacao(new Date(2026, 9, 10, 19))).toBe('Boa noite')
  })

  it('agrupa o histórico em hoje, ontem e o dia da semana', () => {
    expect(rotuloDoDia(iso(2026, 9, 10, 0, 5), agora)).toBe('Hoje')
    expect(rotuloDoDia(iso(2026, 9, 9, 23, 50), agora)).toBe('Ontem')
    expect(rotuloDoDia(iso(2026, 9, 8, 12), agora)).toMatch(/8 de out/)
  })

  it('diz quando aconteceu com a hora', () => {
    expect(quando(iso(2026, 9, 10, 14, 32), agora)).toBe('hoje 14:32')
    expect(quando(iso(2026, 9, 9, 17, 40), agora)).toBe('ontem 17:40')
    expect(quando(iso(2026, 9, 3, 9, 15), agora)).toBe('03/10 09:15')
  })
})
