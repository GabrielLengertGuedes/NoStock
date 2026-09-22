import { obterPool } from '../../db/pool.js'
import { statusEstoqueSql } from '../../shared/statusEstoque.js'

const STATUS_SQL = statusEstoqueSql('p.quantidade_atual', 'p.estoque_minimo')

// CA13.1/RN06: como os dois lados sao sempre >= 0 (constraints da tabela),
// "quantidade_atual <= estoque_minimo" cobre exatamente SEM_ESTOQUE, CRITICO
// e BAIXO — a mesma comparacao que ix_produtos_reposicao indexa.
// CA13.4: fornecedor nulo fica sempre por ultimo (nulls last).
export async function obterItensParaRepor({ fornecedorId, status }, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select p.id as "produtoId", p.nome,
            p.quantidade_atual as "quantidadeAtual",
            p.estoque_minimo as "estoqueMinimo",
            (${STATUS_SQL}) as "statusEstoque",
            f.id as "fornecedorId", f.nome as "fornecedorNome",
            f.contato_nome as "fornecedorContatoNome",
            f.telefone as "fornecedorTelefone",
            f.email as "fornecedorEmail"
       from public.produtos p
       left join public.fornecedores f on f.id = p.fornecedor_id
      where p.ativo
        and p.quantidade_atual <= p.estoque_minimo
        and ($1::int is null or p.fornecedor_id = $1::int)
        and ($2::text is null or (${STATUS_SQL}) = $2::text)
      order by f.nome nulls last, p.nome`,
    [fornecedorId ?? null, status ?? null],
  )
  return rows
}
