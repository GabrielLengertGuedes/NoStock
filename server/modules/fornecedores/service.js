import { AppError } from '../../shared/AppError.js'
import * as repositorio from './repository.js'

const VIOLACAO_DE_UNICIDADE = '23505'

function conflitoDeCnpj(erro, cnpj) {
  return erro?.code === VIOLACAO_DE_UNICIDADE
    ? new AppError('CONFLITO', `Já existe um fornecedor cadastrado com o CNPJ ${cnpj}.`, {
        cnpj: 'Este CNPJ já está em uso',
      })
    : erro
}

const naoEncontrado = () => new AppError('NAO_ENCONTRADO', 'Fornecedor não encontrado.')

export function listar(filtros) {
  return repositorio.listar(filtros)
}

export async function buscarPorId(id) {
  const fornecedor = await repositorio.buscarPorId(id)
  if (!fornecedor) throw naoEncontrado()
  return fornecedor
}

export async function criar(dados) {
  try {
    return await repositorio.criar(dados)
  } catch (erro) {
    throw conflitoDeCnpj(erro, dados.cnpj)
  }
}

export async function atualizar(id, dados) {
  let fornecedor
  try {
    fornecedor = await repositorio.atualizar(id, dados)
  } catch (erro) {
    throw conflitoDeCnpj(erro, dados.cnpj)
  }

  if (!fornecedor) throw naoEncontrado()
  return fornecedor
}

export async function inativar(id) {
  if (await repositorio.temProdutosAtivos(id)) {
    throw new AppError('REGRA_NEGOCIO', 'Fornecedor com produtos ativos não pode ser inativado.')
  }

  const fornecedor = await repositorio.inativar(id)
  if (fornecedor) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrado()

  throw new AppError('REGRA_NEGOCIO', 'Esse fornecedor já está inativo.')
}
