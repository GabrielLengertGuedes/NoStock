import { obterPool } from '../../db/pool.js'
import { statusEstoqueSql } from '../../shared/statusEstoque.js'

const STATUS_SQL = statusEstoqueSql('p.quantidade_atual', 'p.estoque_minimo')

// Mesma severidade usada em toda a aplicacao (BadgeStatus, filtro PRECISA_REPOR):
// sem estoque e sempre mais urgente que critico, que e mais urgente que baixo.
const PRIORIDADE_SQL = `case (${STATUS_SQL})
    when 'SEM_ESTOQUE' then 0
    when 'CRITICO' then 1
    when 'BAIXO' then 2
    else 3
  end`

// Os 4 cards do dashboard (db/consultas-referencia.sql). entradasHoje/saidasHoje
// usam os limites do dia no fuso da loja/cliente, nunca no fuso do servidor.
export async function obterCards({ inicioDoDia, fimDoDia }, conexao = obterPool()) {
  const [{ rows: produtos }, { rows: movimentacoes }] = await Promise.all([
    conexao.query(`
      select count(*)::int as "totalProdutos",
             count(*) filter (where (${STATUS_SQL}) = 'SEM_ESTOQUE')::int as "semEstoque",
             count(*) filter (where (${STATUS_SQL}) in ('BAIXO', 'CRITICO'))::int as "estoqueBaixo"
        from public.produtos p
       where p.ativo
    `),
    conexao.query(
      `select count(*) filter (where tipo = 'ENTRADA')::int as "entradasHoje",
              count(*) filter (where tipo = 'SAIDA')::int as "saidasHoje"
         from public.movimentacoes
        where criado_em >= $1 and criado_em < $2`,
      [inicioDoDia, fimDoDia],
    ),
  ])

  return { ...produtos[0], ...movimentacoes[0] }
}

// Prioriza os produtos que mais precisam de reposicao: primeiro pela
// severidade do status, depois por quem esta mais longe do minimo.
// CA10.4: no maximo 10 itens — o restante fica na listagem completa.
export async function obterProdutosAtencao(conexao = obterPool()) {
  const { rows } = await conexao.query(`
    select p.id, p.nome,
           jsonb_build_object('id', c.id, 'nome', c.nome) as categoria,
           p.quantidade_atual as "quantidadeAtual",
           p.estoque_minimo as "estoqueMinimo",
           p.preco_venda::float8 as "precoVenda",
           (${STATUS_SQL}) as "statusEstoque"
      from public.produtos p
      join public.categorias c on c.id = p.categoria_id
     where p.ativo
       and (${STATUS_SQL}) in ('BAIXO', 'CRITICO', 'SEM_ESTOQUE')
     order by ${PRIORIDADE_SQL},
              (p.estoque_minimo - p.quantidade_atual) desc,
              p.nome asc
     limit 10
  `)

  return rows
}
