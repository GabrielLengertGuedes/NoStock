import { obterPool } from '../../db/pool.js'
import { statusEstoqueSql } from '../../shared/statusEstoque.js'

const STATUS_SQL = statusEstoqueSql('p.quantidade_atual', 'p.estoque_minimo')

export async function listarResumo(conexao = obterPool()) {
  const [{ rows: totalRows }, { rows: baixoRows }, { rows: zeradoRows }, { rows: entradasRows }] = await Promise.all([
    conexao.query(`select count(*)::int as total from public.produtos p where p.ativo = true`),
    conexao.query(`select count(*)::int as total from public.produtos p where p.ativo = true and (${STATUS_SQL}) in ('BAIXO','CRITICO')`),
    conexao.query(`select count(*)::int as total from public.produtos p where p.ativo = true and (${STATUS_SQL}) = 'SEM_ESTOQUE'`),
    conexao.query(
      `select count(*)::int as total
       from public.movimentacoes m
       where m.tipo = 'ENTRADA'
         and m.criado_em >= current_date at time zone 'UTC'
         and m.criado_em < current_date + interval '1 day' at time zone 'UTC'`,
    ),
  ])

  const { rows: produtosRows } = await conexao.query(
    `select p.id, p.nome, p.descricao,
            jsonb_build_object('id', c.id, 'nome', c.nome) as categoria,
            p.preco_venda::float8 as "precoVenda",
            p.quantidade_atual as "quantidadeAtual",
            p.estoque_minimo as "estoqueMinimo",
            (${STATUS_SQL}) as "statusEstoque"
       from public.produtos p
       join public.categorias c on c.id = p.categoria_id
       where p.ativo = true and (${STATUS_SQL}) in ('BAIXO','CRITICO','SEM_ESTOQUE')
       order by case (${STATUS_SQL})
                  when 'SEM_ESTOQUE' then 1
                  when 'CRITICO' then 2
                  when 'BAIXO' then 3
                  else 4
                end asc,
                p.nome asc
       limit 10`,
  )

  return {
    totalItens: totalRows[0]?.total ?? 0,
    totalBaixo: baixoRows[0]?.total ?? 0,
    totalZerado: zeradoRows[0]?.total ?? 0,
    totalEntradasHoje: entradasRows[0]?.total ?? 0,
    produtosAtencao: produtosRows,
  }
}
