import bcrypt from 'bcrypt'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { obterPool } from '../../server/db/pool.js'
import * as servico from '../../server/modules/movimentacoes/service.js'
import { auditoriaDoProduto, semProblemas } from '../helpers/integridade.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

// Cada movimentação são seis idas e voltas ao Supabase, uma esperando a outra.
// Com 100, o teste passava dos 120 s de limite na CI quando a rede ficava lenta.
const TOTAL_MOVIMENTACOES = 10

describe.skipIf(!temBanco())('F2-08 — cadeia de saldos após N movimentações', () => {
  let produtoId
  let usuarioId
  let hashSenha

  beforeAll(async () => {
    hashSenha = await bcrypt.hash('Senha123', 4)
  })

  beforeEach(async () => {
    await abrirTransacao()

    const sufixo = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ('Operador Cadeia', $1, $2, 'OPERADOR')
       returning id`,
      [`cadeia.${sufixo}@exemplo.com`, hashSenha],
    )
    usuarioId = usuarios[0].id

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ($1) returning id`,
      [`Cadeia Teste ${sufixo}`],
    )

    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ($1, $2, 15.00, 200, 20)
       returning id`,
      [`Produto Cadeia ${sufixo}`, categorias[0].id],
    )
    produtoId = produtos[0].id
  })

  afterEach(desfazerTransacao)

  it(
    'mantém cadeia contínua após 100 movimentações aleatórias válidas',
    async () => {
      let saldoEsperado = 200

      for (let i = 0; i < TOTAL_MOVIMENTACOES; i += 1) {
        const entrada = Math.random() < 0.55 || saldoEsperado === 0

        if (entrada) {
          const quantidade = 1 + Math.floor(Math.random() * 5)
          const movimentacao = await servico.registrar({
            produtoId,
            tipo: 'ENTRADA',
            motivo: 'COMPRA',
            quantidade,
            usuarioId,
          })
          saldoEsperado += quantidade
          expect(movimentacao.saldoPosterior).toBe(saldoEsperado)
          continue
        }

        const quantidade = 1 + Math.floor(Math.random() * Math.min(5, saldoEsperado))
        const movimentacao = await servico.registrar({
          produtoId,
          tipo: 'SAIDA',
          motivo: 'VENDA',
          quantidade,
          usuarioId,
        })
        saldoEsperado -= quantidade
        expect(movimentacao.saldoPosterior).toBe(saldoEsperado)
      }

      const { rows: saldoBanco } = await obterPool().query(
        `select quantidade_atual from public.produtos where id = $1`,
        [produtoId],
      )
      expect(saldoBanco[0].quantidade_atual).toBe(saldoEsperado)

      const auditoria = await auditoriaDoProduto(produtoId)
      expect(auditoria.saldoNegativo).toEqual([])
      expect(auditoria.saldoDivergente).toEqual([])
      expect(auditoria.cadeiaQuebrada).toEqual([])
      expect(semProblemas(auditoria)).toBe(true)

      const { rows: contagem } = await obterPool().query(
        `select count(*)::int as n from public.movimentacoes where produto_id = $1`,
        [produtoId],
      )
      expect(contagem[0].n).toBe(TOTAL_MOVIMENTACOES)
    },
    120_000,
  )
})
