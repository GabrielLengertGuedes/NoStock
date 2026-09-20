import * as repositorio from './repository.js'

// CA15.4 / dados-e-api.md: giro = unidades vendidas ÷ saldo médio do período.
const FORMULA_GIRO = 'unidades vendidas no período ÷ saldo médio do período'

function arredondar(valor) {
  return Math.round(valor * 100) / 100
}

function saldoMedio(saldoInicial, saldoFinal) {
  return arredondar((saldoInicial + saldoFinal) / 2)
}

function calcularGiro(unidadesVendidas, media) {
  if (media <= 0) return null
  return arredondar(unidadesVendidas / media)
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
  const linhas = await repositorio.obterVendasESaldoMedioPorProduto({ de, ate, categoriaId })

  const produtos = linhas.map((linha) => {
    const media = saldoMedio(linha.saldoInicial, linha.saldoFinal)
    return {
      id: linha.id,
      nome: linha.nome,
      categoria: linha.categoria,
      unidadesVendidas: linha.unidadesVendidas,
      saldoMedio: media,
      giro: calcularGiro(linha.unidadesVendidas, media),
    }
  })

  const totalVendidas = produtos.reduce((soma, p) => soma + p.unidadesVendidas, 0)
  const totalSaldoMedio = arredondar(produtos.reduce((soma, p) => soma + p.saldoMedio, 0))

  return {
    formula: FORMULA_GIRO,
    periodo: { de, ate },
    geral: {
      unidadesVendidas: totalVendidas,
      saldoMedio: totalSaldoMedio,
      giro: calcularGiro(totalVendidas, totalSaldoMedio),
    },
    produtos,
  }
}
