export const ROTULO_MOTIVO = Object.freeze({
  COMPRA: 'Compra',
  VENDA: 'Venda',
  DESCARTE: 'Descarte',
  DEVOLUCAO: 'Devolução',
  ESTOQUE_INICIAL: 'Estoque inicial',
  AJUSTE_INVENTARIO: 'Ajuste de inventário',
})

export function primeiroNome(nome) {
  return nome?.trim().split(/\s+/)[0] ?? ''
}

// A mesma conta do GET /reposicao: o dobro do mínimo menos o saldo,
// nunca menos que 1. Aqui só para a tela do produto não buscar a reposição inteira.
export function quantidadeSugerida(estoqueMinimo, quantidadeAtual) {
  return Math.max((estoqueMinimo ?? 0) * 2 - (quantidadeAtual ?? 0), 1)
}
