import { obterPool } from '../../db/pool.js'

const COLUNAS = 'id, nome, cnpj, contato_nome, telefone, email, observacao, ativo'

export async function listar({ incluirInativos = false } = {}, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select f.id, f.nome, f.cnpj, f.contato_nome, f.telefone, f.email, f.observacao, f.ativo,
            count(p.id)::int as "totalProdutos"
     from public.fornecedores f
     left join public.produtos p on p.fornecedor_id = f.id and p.ativo = true
     where ($1 or f.ativo)
     group by f.id
     order by f.nome`,
    [incluirInativos],
  )
  return rows
}

export async function buscarPorId(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select ${COLUNAS} from public.fornecedores where id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function criar(dados, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `insert into public.fornecedores (nome, cnpj, contato_nome, telefone, email, observacao)
     values ($1, $2, $3, $4, $5, $6) returning ${COLUNAS}`,
    [dados.nome, dados.cnpj, dados.contato_nome, dados.telefone, dados.email, dados.observacao],
  )
  return rows[0]
}

export async function atualizar(id, dados, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.fornecedores set nome = $2, cnpj = $3, contato_nome = $4, telefone = $5, email = $6, observacao = $7
     where id = $1 returning ${COLUNAS}`,
    [id, dados.nome, dados.cnpj, dados.contato_nome, dados.telefone, dados.email, dados.observacao],
  )
  return rows[0] ?? null
}

export async function inativar(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `update public.fornecedores set ativo = false
     where id = $1 and ativo returning ${COLUNAS}`,
    [id],
  )
  return rows[0] ?? null
}

export async function temProdutosAtivos(id, conexao = obterPool()) {
  const { rows } = await conexao.query(
    `select 1 from public.produtos where fornecedor_id = $1 and ativo = true limit 1`,
    [id],
  )
  return rows.length > 0
}
