import { statusEstoque } from '../../shared/statusEstoque.js'

// Do menos ao mais grave. Alerta so sai quando a movimentacao sobe o produto
// nesta escada: vender mais uma unidade de algo que ja estava baixo nao avisa de novo.
const GRAVIDADE = { NORMAL: 0, BAIXO: 1, CRITICO: 2, SEM_ESTOQUE: 3 }

export const NIVEIS = Object.freeze(['BAIXO', 'CRITICO', 'SEM_ESTOQUE'])

const TITULO = {
  BAIXO: 'Estoque baixo',
  CRITICO: 'Crítico',
  SEM_ESTOQUE: 'Acabou',
}

const MOTIVO = {
  VENDA: 'Venda',
  DESCARTE: 'Descarte',
  AJUSTE_INVENTARIO: 'Ajuste de inventário',
}

/** Status para o qual o produto piorou, ou null se ficou igual ou melhorou. */
export function statusQuePiorou({ saldoAnterior, saldoPosterior, estoqueMinimo }) {
  const antes = statusEstoque(saldoAnterior, estoqueMinimo)
  const depois = statusEstoque(saldoPosterior, estoqueMinimo)
  return GRAVIDADE[depois] > GRAVIDADE[antes] ? depois : null
}

function primeiroNome(nome) {
  return nome?.trim().split(/\s+/)[0] || 'alguém'
}

// No AJUSTE a quantidade e o saldo final, nao o quanto saiu: so o nome do ajuste diz algo.
function oQueAconteceu({ tipo, motivo, quantidade, usuario }) {
  const rotulo = MOTIVO[motivo] ?? 'Saída'
  const autor = primeiroNome(usuario?.nome)
  if (tipo === 'AJUSTE') return `${rotulo} por ${autor}.`
  return `${rotulo} de ${quantidade} un por ${autor}.`
}

/** Texto e destino do alerta. O tag faz o alerta novo de um produto substituir o anterior. */
export function montarAlerta({ status, produto, movimentacao }) {
  const partes = []
  if (status !== 'SEM_ESTOQUE') {
    partes.push(`Restam ${movimentacao.saldoPosterior} un (mínimo ${produto.estoqueMinimo}).`)
  }
  partes.push(oQueAconteceu(movimentacao))
  if (produto.fornecedorNome) partes.push(`Fornecedor: ${produto.fornecedorNome}.`)

  return {
    titulo: `${TITULO[status]}: ${produto.nome}`,
    corpo: partes.join(' '),
    url: `/m/produtos/${produto.id}`,
    tag: `produto-${produto.id}`,
  }
}
