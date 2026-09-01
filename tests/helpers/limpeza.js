import { obterPool } from '../../server/db/pool.js'

// O teste de concorrência é o único que precisa commitar de verdade (ADR-013):
// conexões paralelas não enxergam a transação de rollback do helper. Sem esta
// limpeza os dados ficam no banco compartilhado e quebram quem afere a tabela
// inteira — foi o que derrubou o teste de listagem da F2-04.
const TRIGGER_APPEND_ONLY = 'tg_mov_append_only'

// Sobras mais novas que isto podem ser de uma execução em andamento (o CI roda
// arquivos em paralelo, e duas PRs podem rodar ao mesmo tempo): não se mexe.
const IDADE_MINIMA_DA_SOBRA = '1 hour'

// As movimentações são append-only por trigger (RN03 / Artigo I.3): apagar exige
// desligar o gatilho. Feito dentro da transação — DDL no Postgres é transacional
// e pega lock na tabela, então a guarda nunca fica desligada para outra conexão
// e volta sozinha em qualquer erro.
async function semAppendOnly(executar) {
  const conexao = await obterPool().connect()

  try {
    await conexao.query('begin')
    await conexao.query(`alter table public.movimentacoes disable trigger ${TRIGGER_APPEND_ONLY}`)
    await executar(conexao)
    await conexao.query(`alter table public.movimentacoes enable trigger ${TRIGGER_APPEND_ONLY}`)
    await conexao.query('commit')
  } catch (erro) {
    await conexao.query('rollback').catch(() => {})
    throw erro
  } finally {
    conexao.release()
  }
}

// Remove exatamente as linhas que o teste criou, pelos ids que ele guardou.
export async function removerCenarios(cenarios) {
  const produtoIds = cenarios.map((c) => c.produtoId).filter(Boolean)
  const categoriaIds = cenarios.map((c) => c.categoriaId).filter(Boolean)
  const usuarioIds = cenarios.map((c) => c.usuarioId).filter(Boolean)

  if (!produtoIds.length && !categoriaIds.length && !usuarioIds.length) return

  await semAppendOnly(async (conexao) => {
    await conexao.query(
      `delete from public.movimentacoes
        where produto_id = any($1::int[]) or usuario_id = any($2::int[])`,
      [produtoIds, usuarioIds],
    )
    await conexao.query(`delete from public.produtos where id = any($1::int[])`, [produtoIds])
    await conexao.query(`delete from public.categorias where id = any($1::int[])`, [categoriaIds])
    await conexao.query(`delete from public.usuarios where id = any($1::int[])`, [usuarioIds])
  })
}

// Rede de segurança: uma execução interrompida no meio não chega ao afterAll e
// deixa sobra para sempre. Varre só o que este arquivo cria e só o que é velho
// demais para pertencer a uma execução viva.
export async function removerSobrasAntigas() {
  const antigos = `criado_em < now() - interval '${IDADE_MINIMA_DA_SOBRA}'`
  const produtosAntigos = `
    select id from public.produtos
     where nome like '[teste] Produto %' and ${antigos}`
  const usuariosAntigos = `
    select id from public.usuarios
     where email like 'concorrencia.%@exemplo.com' and ${antigos}`

  await semAppendOnly(async (conexao) => {
    await conexao.query(
      `delete from public.movimentacoes
        where produto_id in (${produtosAntigos}) or usuario_id in (${usuariosAntigos})`,
    )
    await conexao.query(`delete from public.produtos where id in (${produtosAntigos})`)
    await conexao.query(
      `delete from public.categorias
        where nome like '[teste] Categoria %' and ${antigos}`,
    )
    await conexao.query(`delete from public.usuarios where id in (${usuariosAntigos})`)
  })
}
