import { emTransacao } from '../../db/transaction.js'
import { AppError } from '../../shared/AppError.js'
import { statusEstoque } from '../../shared/statusEstoque.js'
import * as repositorio from './repository.js'
import { combinaTipoMotivo } from './tipoMotivo.js'

const produtoNaoEncontrado = () =>
  new AppError('NAO_ENCONTRADO', 'Produto não encontrado.')

function validarEntrada({ tipo, motivo, quantidade, observacao }) {
  if (!combinaTipoMotivo(tipo, motivo)) {
    throw new AppError(
      'REGRA_NEGOCIO',
      `A combinação "${tipo}" com motivo "${motivo}" não é permitida.`,
      { motivo: 'Motivo inválido para este tipo de movimentação' },
    )
  }

  if (tipo === 'AJUSTE') {
    if (quantidade < 0) {
      throw new AppError('VALIDACAO', 'Dados inválidos.', {
        quantidade: 'Não pode ser negativo',
      })
    }
    if (!observacao?.trim()) {
      throw new AppError('REGRA_NEGOCIO', 'Ajuste de inventário exige observação.', {
        observacao: 'Informe o motivo do ajuste',
      })
    }
    return
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new AppError('VALIDACAO', 'Dados inválidos.', {
      quantidade: 'Informe uma quantidade maior que zero',
    })
  }
}

function calcularSaldos(tipo, saldoAnterior, quantidade) {
  if (tipo === 'ENTRADA') {
    return { saldoPosterior: saldoAnterior + quantidade, quantidadeRegistrada: quantidade }
  }

  if (tipo === 'SAIDA') {
    const saldoPosterior = saldoAnterior - quantidade
    if (saldoPosterior < 0) {
      throw new AppError(
        'SALDO_INSUFICIENTE',
        `Saldo insuficiente: o produto tem ${saldoAnterior} unidades disponíveis.`,
        { quantidade: `Máximo disponível: ${saldoAnterior}` },
      )
    }
    return { saldoPosterior, quantidadeRegistrada: quantidade }
  }

  // AJUSTE: quantidade é o saldo final desejado (RN04).
  return { saldoPosterior: quantidade, quantidadeRegistrada: quantidade }
}

function formatarResposta(movimentacao) {
  const { estoqueMinimo, ...dados } = movimentacao
  return {
    ...dados,
    statusEstoqueResultante: statusEstoque(dados.saldoPosterior, estoqueMinimo),
  }
}

// usuarioId vem sempre da sessão no controller — nunca do corpo da requisição (Artigo I.4).
export async function registrar({ produtoId, tipo, motivo, quantidade, observacao = null, usuarioId }) {
  validarEntrada({ tipo, motivo, quantidade, observacao })

  const id = await emTransacao(async (conexao) => {
    const produto = await repositorio.trancarProdutoAtivo(produtoId, conexao)
    if (!produto) throw produtoNaoEncontrado()

    const saldoAnterior = produto.quantidade_atual
    const { saldoPosterior, quantidadeRegistrada } = calcularSaldos(tipo, saldoAnterior, quantidade)

    await repositorio.atualizarSaldo(produtoId, saldoPosterior, conexao)

    return repositorio.inserirMovimentacao(
      {
        produtoId,
        usuarioId,
        tipo,
        motivo,
        quantidade: quantidadeRegistrada,
        saldoAnterior,
        saldoPosterior,
        precoUnitario: produto.preco_venda,
        observacao: observacao?.trim() || null,
      },
      conexao,
    )
  })

  const movimentacao = await repositorio.buscarPorId(id)
  return formatarResposta(movimentacao)
}

export async function listar(filtros) {
  const { pagina = 1, porPagina = 20 } = filtros
  const { movimentacoes, total } = await repositorio.listar(filtros)

  return {
    dados: movimentacoes,
    meta: {
      pagina,
      porPagina,
      total,
      totalPaginas: Math.ceil(total / porPagina),
    },
  }
}

export async function listarPorProduto(produtoId, filtros) {
  if (!(await repositorio.produtoExiste(produtoId))) {
    throw produtoNaoEncontrado()
  }

  return listar({ ...filtros, produtoId })
}
