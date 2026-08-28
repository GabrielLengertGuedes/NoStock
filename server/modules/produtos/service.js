import { emTransacao } from '../../db/transaction.js'
import { AppError } from '../../shared/AppError.js'
import * as repositorio from './repository.js'

const naoEncontrado = () => new AppError('NAO_ENCONTRADO', 'Produto não encontrado.')

// CA6.4: as mesmas validacoes do RF02 valem tambem para PUT e reativar, entao
// as tres entradas (criar, atualizar, reativar) passam por aqui.
async function recusarSeNomeDuplicado(nome, { excluirId, confirmarNomeDuplicado = false } = {}) {
  if (confirmarNomeDuplicado) return
  if (!(await repositorio.existeAtivoComMesmoNome({ nome, excluirId }))) return

  throw new AppError('NOME_DUPLICADO', `Já existe um produto ativo chamado "${nome}".`, {
    nome: 'Já existe um produto ativo com esse nome',
  })
}

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
  await recusarSeNomeDuplicado(dados.nome, { confirmarNomeDuplicado })

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

export async function atualizar(id, { confirmarNomeDuplicado, ...dados }) {
  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  await recusarSeNomeDuplicado(dados.nome, { excluirId: id, confirmarNomeDuplicado })

  await repositorio.atualizar(id, dados)
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
  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()
  if (existente.ativo) throw new AppError('REGRA_NEGOCIO', 'Esse produto já está ativo.')

  // Sem essa checagem, um produto inativo cujo nome ja foi reusado por outro
  // ativo voltaria e duplicaria o nome sem nenhum aviso (CA6.4).
  await recusarSeNomeDuplicado(existente.nome, { excluirId: id })

  await repositorio.reativar(id)
}
