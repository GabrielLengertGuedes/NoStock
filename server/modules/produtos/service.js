import { emTransacao } from '../../db/transaction.js'
import { AppError } from '../../shared/AppError.js'
import { buscarPorId as buscarCategoria } from '../categorias/repository.js'
import { buscarPorId as buscarFornecedor } from '../fornecedores/repository.js'
import * as repositorio from './repository.js'

const naoEncontrado = () => new AppError('NAO_ENCONTRADO', 'Produto não encontrado.')

// Categoria e fornecedor inativos nao recebem produto ativo: e a mesma regra
// que impede inativar categoria/fornecedor com produto ativo, vista do outro lado.
// categoriaId ou fornecedorId nulos ficam de fora da conferencia.
async function problemasDosVinculos({ categoriaId, fornecedorId }) {
  const campos = {}

  if (categoriaId != null) {
    const categoria = await buscarCategoria(categoriaId)
    if (!categoria) campos.categoriaId = 'Categoria não encontrada'
    else if (!categoria.ativo) campos.categoriaId = `A categoria "${categoria.nome}" está inativa`
  }

  if (fornecedorId != null) {
    const fornecedor = await buscarFornecedor(fornecedorId)
    if (!fornecedor) campos.fornecedorId = 'Fornecedor não encontrado'
    else if (!fornecedor.ativo) campos.fornecedorId = `O fornecedor "${fornecedor.nome}" está inativo`
  }

  return Object.keys(campos).length > 0 ? campos : null
}

async function exigirVinculosAtivos(vinculos) {
  const campos = await problemasDosVinculos(vinculos)
  if (campos) throw new AppError('VALIDACAO', `${Object.values(campos).join('. ')}.`, campos)
}

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

export function obterResumo() {
  return repositorio.obterResumo()
}

// Devolve tambem produto inativo: a tela de edicao abre um produto que saiu do catalogo.
export async function buscarPorId(id) {
  const produto = await repositorio.buscarDetalhe(id)
  if (!produto) throw naoEncontrado()
  return produto
}

export async function criar({ usuarioId, confirmarNomeDuplicado, ...dados }) {
  await exigirVinculosAtivos(dados)
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

  // So o vinculo que mudou precisa estar ativo: editar o preco de um produto
  // inativo nao pode exigir que a categoria antiga dele volte a existir.
  const categoriaMudou = dados.categoriaId !== existente.categoria.id
  const fornecedorMudou = dados.fornecedorId !== (existente.fornecedor?.id ?? null)
  if (categoriaMudou || fornecedorMudou) {
    await exigirVinculosAtivos({
      categoriaId: categoriaMudou ? dados.categoriaId : null,
      fornecedorId: fornecedorMudou ? dados.fornecedorId : null,
    })
  }

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

  const vinculosInativos = await problemasDosVinculos({
    categoriaId: existente.categoria.id,
    fornecedorId: existente.fornecedor?.id ?? null,
  })
  if (vinculosInativos) {
    throw new AppError(
      'REGRA_NEGOCIO',
      `${Object.values(vinculosInativos).join('. ')}. Reative antes de reativar o produto.`,
    )
  }

  // Sem essa checagem, um produto inativo cujo nome ja foi reusado por outro
  // ativo voltaria e duplicaria o nome sem nenhum aviso (CA6.4).
  await recusarSeNomeDuplicado(existente.nome, { excluirId: id })

  await repositorio.reativar(id)
}
