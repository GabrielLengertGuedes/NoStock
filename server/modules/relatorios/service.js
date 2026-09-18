import * as repositorio from './repository.js'

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
