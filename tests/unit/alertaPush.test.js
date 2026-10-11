import { describe, expect, it } from 'vitest'

import { montarAlerta, statusQuePiorou } from '../../server/modules/notificacoes/alerta.js'
import { enderecoDePushConhecido } from '../../server/modules/notificacoes/schema.js'

describe('statusQuePiorou', () => {
  it('devolve o status novo quando a saída sobe o produto na escada', () => {
    expect(statusQuePiorou({ saldoAnterior: 7, saldoPosterior: 5, estoqueMinimo: 6 })).toBe('BAIXO')
    expect(statusQuePiorou({ saldoAnterior: 4, saldoPosterior: 3, estoqueMinimo: 5 })).toBe('CRITICO')
    expect(statusQuePiorou({ saldoAnterior: 2, saldoPosterior: 0, estoqueMinimo: 6 })).toBe('SEM_ESTOQUE')
  })

  it('não avisa de novo quando o produto continua no mesmo nível', () => {
    expect(statusQuePiorou({ saldoAnterior: 3, saldoPosterior: 2, estoqueMinimo: 6 })).toBeNull()
  })

  it('não avisa quando o saldo melhora', () => {
    expect(statusQuePiorou({ saldoAnterior: 2, saldoPosterior: 26, estoqueMinimo: 8 })).toBeNull()
  })

  it('produto sem mínimo só avisa quando acaba', () => {
    expect(statusQuePiorou({ saldoAnterior: 5, saldoPosterior: 1, estoqueMinimo: 0 })).toBeNull()
    expect(statusQuePiorou({ saldoAnterior: 1, saldoPosterior: 0, estoqueMinimo: 0 })).toBe('SEM_ESTOQUE')
  })
})

describe('montarAlerta', () => {
  const produto = { id: 9, nome: 'Ração Golden 15kg', estoqueMinimo: 6, fornecedorNome: 'Litoral Pet' }
  const venda = {
    tipo: 'SAIDA',
    motivo: 'VENDA',
    quantidade: 2,
    saldoPosterior: 5,
    usuario: { nome: 'Carla Souza' },
  }

  it('diz o que restou, o que aconteceu e de quem comprar', () => {
    expect(montarAlerta({ status: 'BAIXO', produto, movimentacao: venda })).toEqual({
      titulo: 'Estoque baixo: Ração Golden 15kg',
      corpo: 'Restam 5 un (mínimo 6). Venda de 2 un por Carla. Fornecedor: Litoral Pet.',
      url: '/m/produtos/9',
      tag: 'produto-9',
    })
  })

  it('quando acaba, não repete o saldo zero', () => {
    const alerta = montarAlerta({
      status: 'SEM_ESTOQUE',
      produto,
      movimentacao: { ...venda, saldoPosterior: 0 },
    })

    expect(alerta.titulo).toBe('Acabou: Ração Golden 15kg')
    expect(alerta.corpo).toBe('Venda de 2 un por Carla. Fornecedor: Litoral Pet.')
  })

  it('no ajuste não fala em quantidade, porque ela é o saldo final', () => {
    const alerta = montarAlerta({
      status: 'CRITICO',
      produto: { ...produto, fornecedorNome: null },
      movimentacao: { tipo: 'AJUSTE', motivo: 'AJUSTE_INVENTARIO', quantidade: 2, saldoPosterior: 2, usuario: { nome: 'Marina' } },
    })

    expect(alerta.corpo).toBe('Restam 2 un (mínimo 6). Ajuste de inventário por Marina.')
  })
})

describe('enderecoDePushConhecido', () => {
  it('aceita os serviços de push dos navegadores', () => {
    expect(enderecoDePushConhecido('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(enderecoDePushConhecido('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
    expect(enderecoDePushConhecido('https://web.push.apple.com/QGx')).toBe(true)
    expect(enderecoDePushConhecido('https://wns2-bl2p.notify.windows.com/w/?token=abc')).toBe(true)
  })

  it('recusa qualquer outro endereço, para a API não virar ponte para terceiros', () => {
    expect(enderecoDePushConhecido('http://fcm.googleapis.com/fcm/send/abc')).toBe(false)
    expect(enderecoDePushConhecido('https://exemplo.com/push')).toBe(false)
    expect(enderecoDePushConhecido('https://fcm.googleapis.com.exemplo.com/x')).toBe(false)
    expect(enderecoDePushConhecido('https://push.apple.com.exemplo.com/x')).toBe(false)
    expect(enderecoDePushConhecido('https://127.0.0.1/x')).toBe(false)
    expect(enderecoDePushConhecido('não é endereço')).toBe(false)
  })
})
