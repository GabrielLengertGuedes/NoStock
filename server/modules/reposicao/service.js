import * as repositorio from './repository.js'

const MULTIPLICADOR_MINIMO = 2
const SUGESTAO_MINIMA = 1

// RN06: o dobro do minimo menos o saldo atual, nunca menos que 1 unidade.
function quantidadeSugerida(estoqueMinimo, quantidadeAtual) {
  return Math.max(estoqueMinimo * MULTIPLICADOR_MINIMO - quantidadeAtual, SUGESTAO_MINIMA)
}

// Agrupa os itens por fornecedor, preservando a ordem que a consulta ja
// trouxe (fornecedor por nome, "sem fornecedor" sempre por ultimo — CA13.4).
export async function obterReposicao({ fornecedorId, status }) {
  const linhas = await repositorio.obterItensParaRepor({ fornecedorId, status })

  const grupos = []
  const porFornecedorId = new Map()

  for (const linha of linhas) {
    let grupo = porFornecedorId.get(linha.fornecedorId)
    if (!grupo) {
      grupo = {
        fornecedor: linha.fornecedorId
          ? {
              id: linha.fornecedorId,
              nome: linha.fornecedorNome,
              contatoNome: linha.fornecedorContatoNome,
              telefone: linha.fornecedorTelefone,
              email: linha.fornecedorEmail,
            }
          : null,
        itens: [],
        totalItens: 0,
      }
      porFornecedorId.set(linha.fornecedorId, grupo)
      grupos.push(grupo)
    }

    grupo.itens.push({
      produtoId: linha.produtoId,
      nome: linha.nome,
      quantidadeAtual: linha.quantidadeAtual,
      estoqueMinimo: linha.estoqueMinimo,
      statusEstoque: linha.statusEstoque,
      quantidadeSugerida: quantidadeSugerida(linha.estoqueMinimo, linha.quantidadeAtual),
    })
    grupo.totalItens += 1
  }

  return { grupos, totalItens: linhas.length }
}
