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
