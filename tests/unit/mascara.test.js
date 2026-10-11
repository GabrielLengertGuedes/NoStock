import { describe, expect, it } from 'vitest'

import { CARACTERE_CNPJ, mascararCnpj } from '../../src/lib/cnpj.js'
import { aplicarMascara, cursorAposMascara } from '../../src/lib/mascara.js'
import { CARACTERE_TELEFONE, mascararTelefone } from '../../src/lib/telefone.js'

// Simula a pessoa editando: o texto ja digitado com o cursor onde ela parou.
function editar({ digitado, cursor, mascarar, aceita }) {
  const formatado = mascarar(digitado)
  return { formatado, cursor: cursorAposMascara({ digitado, cursor, formatado, aceita }) }
}

const telefone = { mascarar: mascararTelefone, aceita: CARACTERE_TELEFONE }
const cnpj = { mascarar: mascararCnpj, aceita: CARACTERE_CNPJ }

describe('cursorAposMascara', () => {
  it('mantém o cursor depois do dígito trocado no meio do telefone', () => {
    // "(47) 3333-4444": apagou o primeiro 3 e digitou 9 no lugar
    const resultado = editar({ ...telefone, digitado: '(47) 9333-4444', cursor: 6 })

    expect(resultado).toEqual({ formatado: '(47) 9333-4444', cursor: 6 })
  })

  it('acompanha o separador que muda de lugar quando o fixo vira celular', () => {
    // "(47) 3333-4444" com um 9 inserido depois do DDD
    const resultado = editar({ ...telefone, digitado: '(47) 93333-4444', cursor: 6 })

    expect(resultado).toEqual({ formatado: '(47) 93333-4444', cursor: 6 })
  })

  it('pula o separador ao digitar logo antes dele', () => {
    // cursor antes do ponto em "19.980": o 9 novo empurra o ponto para a frente
    const resultado = editar({ ...cnpj, digitado: '199.980', cursor: 3 })

    expect(resultado).toEqual({ formatado: '19.998.0', cursor: 4 })
  })

  it('backspace num separador só passa o cursor por cima dele', () => {
    // "(47) 99999-8888" com o hífen apagado
    const resultado = editar({ ...telefone, digitado: '(47) 999998888', cursor: 10 })

    expect(resultado).toEqual({ formatado: '(47) 99999-8888', cursor: 10 })
  })

  it('vai para o começo quando não sobra caractere antes do cursor', () => {
    expect(editar({ ...telefone, digitado: '(7) 9999', cursor: 1 }).cursor).toBe(0)
  })

  it('vai para o fim ao colar com +55', () => {
    const digitado = '+55 (47) 99999-8888'
    const resultado = editar({ ...telefone, digitado, cursor: digitado.length })

    expect(resultado).toEqual({ formatado: '(47) 99999-8888', cursor: 15 })
  })
})

describe('aplicarMascara', () => {
  it('ignora a tecla que empurraria o último dígito para fora', () => {
    // "(47) 99999-8888" completo, com um 1 digitado logo depois do DDD
    const resultado = aplicarMascara({
      ...telefone,
      digitado: '(47) 199999-8888',
      cursor: 6,
      anterior: '(47) 99999-8888',
      inserido: '1',
    })

    expect(resultado).toEqual({ valor: '(47) 99999-8888', cursor: 5 })
  })

  it('ignora letra digitada nos dígitos verificadores do CNPJ', () => {
    const resultado = aplicarMascara({
      ...cnpj,
      digitado: '12.ABC.345/01DE-3X',
      cursor: 18,
      anterior: '12.ABC.345/01DE-3',
      inserido: 'X',
    })

    expect(resultado).toEqual({ valor: '12.ABC.345/01DE-3', cursor: 17 })
  })

  it('aceita colar com +55 mesmo descartando o código do país', () => {
    const digitado = '+55 (47) 99999-8888'
    const resultado = aplicarMascara({
      ...telefone,
      digitado,
      cursor: digitado.length,
      anterior: '',
      inserido: null,
    })

    expect(resultado).toEqual({ valor: '(47) 99999-8888', cursor: 15 })
  })
})
