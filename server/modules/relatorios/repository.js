import { obterPool } from '../../db/pool.js'

// RN09: o valor vendido usa m.preco_unitario (o preco no momento da venda),
// nunca p.preco_venda — assim um reajuste posterior no cadastro do produto
// nao reescreve receita ja registrada. coalesce zera o periodo sem vendas.
export async function obterResumo({ de, ate }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select coalesce(sum(quantidade * preco_unitario), 0)::float8 as "totalVendido",
            coalesce(sum(quantidade), 0)::int as "unidadesVendidas"
       from public.movimentacoes
      where tipo = 'SAIDA' and motivo = 'VENDA'
        and criado_em between $1 and $2`,
    [de, ate],
  )
  return rows[0]
}

// Ranking de produtos vendidos, agrupado por categoria: dentro de cada
// categoria (ordenada por nome), os produtos vem do mais para o menos vendido.
export async function obterRankingPorCategoria({ de, ate, categoriaId }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select c.id as "categoriaId", c.nome as "categoriaNome",
            p.id as "produtoId", p.nome as "produtoNome",
            sum(m.quantidade)::int as unidades,
            sum(m.quantidade * m.preco_unitario)::float8 as receita
       from public.movimentacoes m
       join public.produtos   p on p.id = m.produto_id
       join public.categorias c on c.id = p.categoria_id
      where m.tipo = 'SAIDA' and m.motivo = 'VENDA'
        and m.criado_em between $1 and $2
        and ($3::int is null or c.id = $3::int)
      group by c.id, c.nome, p.id, p.nome
      order by c.nome, unidades desc`,
    [de, ate, categoriaId ?? null],
  )
  return rows
}

// Fotografia do estoque atual por categoria: unidades e valor imobilizado
// (quantidade x preco de venda). Categoria sem produto ativo ainda aparece,
// com os agregados zerados — coalesce cobre o left join sem correspondencia.
export async function obterDistribuicaoPorCategoria(conexao = obterPool()) {
  const { rows } = await conexao.query(`
    select c.id, c.nome,
           count(p.id)::int as produtos,
           coalesce(sum(p.quantidade_atual), 0)::int as unidades,
           coalesce(sum(p.quantidade_atual * p.preco_venda), 0)::float8 as "valorImobilizado"
      from public.categorias c
      left join public.produtos p on p.categoria_id = c.id and p.ativo
     where c.ativo
     group by c.id, c.nome
     order by unidades desc
  `)
  return rows
}

// Unidades vendidas no periodo + saldo medio (abertura+fechamento)/2.
// Abertura/fechamento sao reconstruidos a partir do saldo atual desfazendo
// o delta (saldo_posterior - saldo_anterior) das movimentacoes posteriores —
// funciona para ENTRADA, SAIDA e AJUSTE sem historico diario de estoque.
export async function obterVendasESaldoMedioPorProduto({ de, ate, categoriaId }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select p.id, p.nome,
            jsonb_build_object('id', c.id, 'nome', c.nome) as categoria,
            coalesce(vendas.unidades, 0)::int as "unidadesVendidas",
            (p.quantidade_atual
              - coalesce(deltas.apos_inicio, 0)
            )::float8 as "saldoInicial",
            (p.quantidade_atual
              - coalesce(deltas.apos_fim, 0)
            )::float8 as "saldoFinal"
       from public.produtos p
       join public.categorias c on c.id = p.categoria_id
       left join (
         select produto_id, sum(quantidade) as unidades
           from public.movimentacoes
          where tipo = 'SAIDA' and motivo = 'VENDA'
            and criado_em between $1 and $2
          group by produto_id
       ) vendas on vendas.produto_id = p.id
       left join (
         select produto_id,
                sum(saldo_posterior - saldo_anterior)
                  filter (where criado_em >= $1) as apos_inicio,
                sum(saldo_posterior - saldo_anterior)
                  filter (where criado_em > $2) as apos_fim
           from public.movimentacoes
          group by produto_id
       ) deltas on deltas.produto_id = p.id
      where p.ativo
        and ($3::int is null or c.id = $3::int)
      order by p.nome`,
    [de, ate, categoriaId ?? null],
  )
  return rows
}
