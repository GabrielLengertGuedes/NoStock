import { AppError } from '../../shared/AppError.js'
import * as repositorio from './repository.js'

const VIOLACAO_DE_UNICIDADE = '23505'

function conflitoDeNome(erro, nome) {
  return erro?.code === VIOLACAO_DE_UNICIDADE
    ? new AppError('CONFLITO', `Já existe uma categoria chamada "${nome}".`, {
        nome: 'Esse nome já está em uso',
      })
    : erro
}

const naoEncontrada = () => new AppError('NAO_ENCONTRADO', 'Categoria não encontrada.')

export function listar(filtros) {
  return repositorio.listar(filtros)
}

export async function buscarPorId(id) {
  const categoria = await repositorio.buscarPorId(id)
  if (!categoria) throw naoEncontrada()
  return categoria
}

export async function criar(dados) {
  try {
    return await repositorio.criar(dados)
  } catch (erro) {
    throw conflitoDeNome(erro, dados.nome)
  }
}

export async function atualizar(id, dados) {
  let categoria
  try {
    categoria = await repositorio.atualizar(id, dados)
  } catch (erro) {
    throw conflitoDeNome(erro, dados.nome)
  }

  if (!categoria) throw naoEncontrada()
  return categoria
}

// Exclusao logica: a categoria sai das listagens e o historico continua de pe.
export async function inativar(id) {
  if (await repositorio.temProdutosAtivos(id)) {
    throw new AppError('REGRA_NEGOCIO', 'Categoria com produtos ativos não pode ser inativada.')
  }

  const categoria = await repositorio.inativar(id)
  if (categoria) return

  const existente = await repositorio.buscarPorId(id)
  if (!existente) throw naoEncontrada()

  throw new AppError('REGRA_NEGOCIO', 'Essa categoria já está inativa.')
}
