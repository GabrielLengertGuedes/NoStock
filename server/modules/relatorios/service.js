import * as repositorio from './repository.js'

// Sem um historico de saldo (o schema so guarda o saldo atual), o giro
// possivel de calcular e o "operacional": quanto se vendeu no periodo frente
// ao que esta parado no estoque hoje. Fica explicito na resposta (campo
// `formula`) para a interface mostrar exatamente o que o numero significa.
const FORMULA_GIRO =
  'Giro de estoque = unidades vendidas no período ÷ quantidade em estoque atual'

function calcularGiro(unidadesVendidas, quantidadeAtual) {
  if (quantidadeAtual <= 0) return null
  return Math.round((unidadesVendidas / quantidadeAtual) * 100) / 100
}

export async function obterResumo({ de, ate }) {
  const resumo = await repositorio.obterResumo({ de, ate })
  return { periodo: { de, ate }, ...resumo }
}

// Agrupa as linhas (uma por produto, ja ordenadas por categoria) em uma
// lista de categorias com seus produtos por dentro, preservando a ordem
// de ranking que a consulta devolveu.
export async function obterRanking({ de, ate, categoriaId }) {
  const linhas = await repositorio.obterRankingPorCategoria({ de, ate, categoriaId })

  const categorias = []
  const porCategoriaId = new Map()

  for (const linha of linhas) {
    let grupo = porCategoriaId.get(linha.categoriaId)
    if (!grupo) {
      grupo = { categoria: { id: linha.categoriaId, nome: linha.categoriaNome }, produtos: [] }
      porCategoriaId.set(linha.categoriaId, grupo)
      categorias.push(grupo)
    }

    grupo.produtos.push({
      id: linha.produtoId,
      nome: linha.produtoNome,
      unidades: linha.unidades,
      receita: linha.receita,
    })
  }

  return { periodo: { de, ate }, agrupar: 'categoria', categorias }
}

export async function obterCategorias() {
  const categorias = await repositorio.obterDistribuicaoPorCategoria()
  return { categorias }
}

export async function obterGiro({ de, ate, categoriaId }) {
  const linhas = await repositorio.obterVendasEEstoquePorProduto({ de, ate, categoriaId })

  const produtos = linhas.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    quantidadeAtual: linha.quantidadeAtual,
    unidadesVendidas: linha.unidadesVendidas,
    giro: calcularGiro(linha.unidadesVendidas, linha.quantidadeAtual),
  }))

  const totalVendidas = produtos.reduce((soma, p) => soma + p.unidadesVendidas, 0)
  const totalEmEstoque = produtos.reduce((soma, p) => soma + p.quantidadeAtual, 0)

  return {
    formula: FORMULA_GIRO,
    periodo: { de, ate },
    geral: {
      unidadesVendidas: totalVendidas,
      quantidadeEmEstoque: totalEmEstoque,
      giro: calcularGiro(totalVendidas, totalEmEstoque),
    },
    produtos,
  }
}
