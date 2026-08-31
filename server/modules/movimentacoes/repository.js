import { obterPool } from '../../db/pool.js'

// ADR-004: trava a linha do produto antes de ler o saldo e gravar a movimentação.
export async function trancarProdutoAtivo(produtoId, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select quantidade_atual, preco_venda, estoque_minimo
       from public.produtos
      where id = $1 and ativo
        for update`,
    [produtoId],
  )
  return rows[0] ?? null
}

export async function atualizarSaldo(produtoId, saldoPosterior, conexao = obterPool()) {
  await conexao.query(
    `update public.produtos set quantidade_atual = $2 where id = $1`,
    [produtoId, saldoPosterior],
  )
}

export async function inserirMovimentacao(
  {
    produtoId,
    usuarioId,
    tipo,
    motivo,
    quantidade,
    saldoAnterior,
    saldoPosterior,
    precoUnitario,
    observacao,
  },
  conexao = obterPool(),
) {
  const { rows } = await conexao.query(
    `insert into public.movimentacoes
       (produto_id, usuario_id, tipo, motivo, quantidade,
        saldo_anterior, saldo_posterior, preco_unitario, observacao)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      produtoId,
      usuarioId,
      tipo,
      motivo,
      quantidade,
      saldoAnterior,
      saldoPosterior,
      precoUnitario,
      observacao,
    ],
  )
  return rows[0].id
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select m.id,
            m.produto_id as "produtoId",
            m.tipo,
            m.motivo,
            m.quantidade,
            m.saldo_anterior as "saldoAnterior",
            m.saldo_posterior as "saldoPosterior",
            m.preco_unitario::float8 as "precoUnitario",
            m.observacao,
            m.criado_em as "criadoEm",
            jsonb_build_object('id', u.id, 'nome', u.nome) as usuario,
            p.estoque_minimo as "estoqueMinimo"
       from public.movimentacoes m
       join public.usuarios u on u.id = m.usuario_id
       join public.produtos p on p.id = m.produto_id
      where m.id = $1`,
    [id],
  )
  return rows[0] ?? null
}
