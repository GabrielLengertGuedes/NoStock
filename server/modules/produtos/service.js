import { emTransacao } from '../../db/transaction.js'
import { AppError } from '../../shared/AppError.js'
import * as repositorio from './repository.js'

const naoEncontrado = () => new AppError('NAO_ENCONTRADO', 'Produto não encontrado.')

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

export async function atualizar(id, dados) {
  const atualizado = await repositorio.atualizar(id, dados)
  if (!atualizado) throw naoEncontrado()

  return repositorio.buscarPorId(id)
}

export async function inativar(id) {
  const inativado = await repositorio.inativar(id)
  if (inativado) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  throw new AppError('REGRA_NEGOCIO', 'Esse produto já está inativo.')
}

export async function reativar(id) {
  const reativado = await repositorio.reativar(id)
  if (reativado) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  throw new AppError('REGRA_NEGOCIO', 'Esse produto já está ativo.')
}
