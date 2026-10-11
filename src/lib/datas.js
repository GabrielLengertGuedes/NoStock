// Datas das telas do celular, no fuso do aparelho, que é o da loja.

const POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const DIA_CURTO = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
const DIA_MES = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const UM_DIA_MS = 86_400_000

function inicioDoDia(valor) {
  const data = new Date(valor)
  data.setHours(0, 0, 0, 0)
  return data
}

function diasAtras(iso, agora) {
  return Math.round((inicioDoDia(agora) - inicioDoDia(iso)) / UM_DIA_MS)
}

/** "Sábado, 10 de outubro" */
export function dataPorExtenso(agora) {
  const texto = POR_EXTENSO.format(agora)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function saudacao(agora) {
  const hora = agora.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** "14:32" */
export function hora(iso) {
  return HORA.format(new Date(iso))
}

/** Cabeçalho de um dia no histórico: "Hoje", "Ontem" ou "qui., 8 de out." */
export function rotuloDoDia(iso, agora) {
  const dias = diasAtras(iso, agora)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  return DIA_CURTO.format(new Date(iso))
}

/** "hoje 14:32", "ontem 17:40" ou "08/10 09:15" */
export function quando(iso, agora) {
  const dias = diasAtras(iso, agora)
  if (dias === 0) return `hoje ${hora(iso)}`
  if (dias === 1) return `ontem ${hora(iso)}`
  return `${DIA_MES.format(new Date(iso))} ${hora(iso)}`
}
