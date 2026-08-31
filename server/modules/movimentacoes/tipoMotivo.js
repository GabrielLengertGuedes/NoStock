// RN04 — combinações válidas de tipo × motivo.
export const MOTIVOS_POR_TIPO = Object.freeze({
  ENTRADA: ['COMPRA', 'DEVOLUCAO', 'ESTOQUE_INICIAL', 'AJUSTE_INVENTARIO'],
  SAIDA: ['VENDA', 'DESCARTE', 'AJUSTE_INVENTARIO'],
  AJUSTE: ['AJUSTE_INVENTARIO'],
})

export function combinaTipoMotivo(tipo, motivo) {
  return MOTIVOS_POR_TIPO[tipo]?.includes(motivo) ?? false
}
