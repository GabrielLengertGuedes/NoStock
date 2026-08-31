import { obterPool } from '../../server/db/pool.js'

// Versão escopada por produto das consultas de db/verificar-integridade.sql.
export async function auditoriaDoProduto(produtoId, conexao = obterPool()) {
  const { rows: saldoNegativo } = await conexao.query(
    `select id, nome, quantidade_atual
       from public.produtos
      where id = $1 and quantidade_atual < 0`,
    [produtoId],
  )

  const { rows: saldoDivergente } = await conexao.query(
    `select p.id, p.nome, p.quantidade_atual, m.saldo_posterior
       from public.produtos p
       join lateral (
             select saldo_posterior
               from public.movimentacoes
              where produto_id = p.id
              order by id desc
              limit 1
            ) m on true
      where p.id = $1
        and p.quantidade_atual <> m.saldo_posterior`,
    [produtoId],
  )

  const { rows: cadeiaQuebrada } = await conexao.query(
    `select m.id, m.saldo_anterior, m.saldo_posterior_anterior
       from (
             select id, saldo_anterior,
                    lag(saldo_posterior) over (order by id) as saldo_posterior_anterior
               from public.movimentacoes
              where produto_id = $1
            ) m
      where m.saldo_posterior_anterior is not null
        and m.saldo_anterior <> m.saldo_posterior_anterior`,
    [produtoId],
  )

  return { saldoNegativo, saldoDivergente, cadeiaQuebrada }
}

export function semProblemas(auditoria) {
  return (
    auditoria.saldoNegativo.length === 0 &&
    auditoria.saldoDivergente.length === 0 &&
    auditoria.cadeiaQuebrada.length === 0
  )
}
