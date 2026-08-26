import * as repositorio from './repository.js'

export async function listar(filtros) {
  const { pagina = 1, porPagina = 20 } = filtros
  const { produtos, total } = await repositorio.listar(filtros)

  return {
    dados: produtos,
    meta: {
      pagina,
      porPagina,
      total,
      totalPaginas: Math.ceil(total / porPagina),
    },
  }
}
