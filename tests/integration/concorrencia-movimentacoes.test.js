import bcrypt from 'bcrypt'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { definirPool, obterPool } from '../../server/db/pool.js'
import * as servico from '../../server/modules/movimentacoes/service.js'
import { auditoriaDoProduto, semProblemas } from '../helpers/integridade.js'
import { temBanco } from '../helpers/banco.js'

// ADR-013: concorrência precisa de commits reais — dados prefixados com [teste].
describe.skipIf(!temBanco())('F2-07 — concorrência em movimentações (RN11, CA5.5)', () => {
  let hashSenha
  const sufixoBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  beforeAll(async () => {
    definirPool(null)
    hashSenha = await bcrypt.hash('Senha123', 4)
  }, 30_000)

  afterAll(() => {
    definirPool(null)
    obterPool()
  })

  async function criarCenario(rotulo) {
    const pool = obterPool()
    const sufixo = `${sufixoBase}-${rotulo}`

    const { rows: usuarios } = await pool.query(
      `insert into public.usuarios (nome, email, senha_hash, papel)
       values ($1, $2, $3, 'OPERADOR')
       returning id`,
      [`Operador ${rotulo}`, `concorrencia.${sufixo}@exemplo.com`, hashSenha],
    )

    const { rows: categorias } = await pool.query(
      `insert into public.categorias (nome) values ($1) returning id`,
      [`[teste] Categoria ${sufixo}`],
    )

    const { rows: produtos } = await pool.query(
      `insert into public.produtos
         (nome, categoria_id, preco_venda, quantidade_atual, estoque_minimo)
       values ($1, $2, 20.00, 10, 5)
       returning id`,
      [`[teste] Produto ${sufixo}`, categorias[0].id],
    )

    return { produtoId: produtos[0].id, usuarioId: usuarios[0].id }
  }

  const saldoAtual = async (produtoId) => {
    const { rows } = await obterPool().query(
      `select quantidade_atual from public.produtos where id = $1`,
      [produtoId],
    )
    return rows[0].quantidade_atual
  }

  const totalMovimentacoes = async (produtoId) => {
    const { rows } = await obterPool().query(
      `select count(*)::int as n from public.movimentacoes where produto_id = $1`,
      [produtoId],
    )
    return rows[0].n
  }

  const saida = ({ produtoId, usuarioId, quantidade }) =>
    servico.registrar({
      produtoId,
      tipo: 'SAIDA',
      motivo: 'VENDA',
      quantidade,
      usuarioId,
    })

  it(
    'serializa duas saídas simultâneas sem perder registro nem corromper saldo',
    async () => {
      const { produtoId, usuarioId } = await criarCenario('paralelas-ok')
      const contexto = { produtoId, usuarioId }

      const resultados = await Promise.allSettled([saida({ ...contexto, quantidade: 3 }), saida({ ...contexto, quantidade: 3 })])

      expect(resultados.every((r) => r.status === 'fulfilled')).toBe(true)
      expect(await saldoAtual(produtoId)).toBe(4)
      expect(await totalMovimentacoes(produtoId)).toBe(2)
      expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
    },
    30_000,
  )

  it(
    'rejeita a segunda saída quando o saldo não comporta as duas',
    async () => {
      const { produtoId, usuarioId } = await criarCenario('paralelas-falha')
      const contexto = { produtoId, usuarioId }

      const resultados = await Promise.allSettled([saida({ ...contexto, quantidade: 8 }), saida({ ...contexto, quantidade: 8 })])

      const sucessos = resultados.filter((r) => r.status === 'fulfilled')
      const falhas = resultados.filter((r) => r.status === 'rejected')

      expect(sucessos).toHaveLength(1)
      expect(falhas).toHaveLength(1)
      expect(falhas[0].reason?.codigo).toBe('SALDO_INSUFICIENTE')
      expect(await saldoAtual(produtoId)).toBe(2)
      expect(await totalMovimentacoes(produtoId)).toBe(1)
      expect(semProblemas(await auditoriaDoProduto(produtoId))).toBe(true)
    },
    30_000,
  )
})
