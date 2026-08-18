export const STATUS_ESTOQUE = Object.freeze(['SEM_ESTOQUE', 'CRITICO', 'BAIXO', 'NORMAL'])

// Nunca e guardado no banco: sai do saldo e do minimo a cada consulta.
export function statusEstoque(saldo, estoqueMinimo) {
  if (saldo <= 0) return 'SEM_ESTOQUE'
  if (estoqueMinimo <= 0) return 'NORMAL'
  if (saldo <= Math.ceil(estoqueMinimo / 2)) return 'CRITICO'
  if (saldo <= estoqueMinimo) return 'BAIXO'
  return 'NORMAL'
}

// A mesma regra, para as consultas que precisam calcular o status em SQL.
// Existe aqui para nao virar uma segunda definicao espalhada pelos modulos.
export function statusEstoqueSql(saldo = 'quantidade_atual', minimo = 'estoque_minimo') {
  return `case
    when ${saldo} <= 0 then 'SEM_ESTOQUE'
    when ${minimo} <= 0 then 'NORMAL'
    when ${saldo} <= ceil(${minimo}::numeric / 2) then 'CRITICO'
    when ${saldo} <= ${minimo} then 'BAIXO'
    else 'NORMAL'
  end`
}
