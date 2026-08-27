import { emTransacao } from '../../db/transaction.js'
import { AppError } from '../../shared/AppError.js'
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

export async function criar({ usuarioId, confirmarNomeDuplicado, ...dados }) {
  if (!confirmarNomeDuplicado && (await repositorio.existeAtivoComMesmoNome(dados.nome))) {
    throw new AppError('NOME_DUPLICADO', `Já existe um produto ativo chamado "${dados.nome}".`, {
      nome: 'Já existe um produto ativo com esse nome',
    })
  }

  return emTransacao(async (conexao) => {
    const id = await repositorio.criar(dados, conexao)

    if (dados.estoqueInicial > 0) {
      await repositorio.registrarEstoqueInicial(
        { produtoId: id, usuarioId, quantidade: dados.estoqueInicial, precoVenda: dados.precoVenda },
        conexao,
      )
    }

    return repositorio.buscarPorId(id, conexao)
  })
}
