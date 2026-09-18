// "Hoje" nao pode depender do fuso do servidor: ele varia por deploy e nunca e
// garantidamente o fuso de quem esta na loja. Este helper calcula o inicio e o
// fim do dia atual no fuso configurado (RN do fuso horario da loja/cliente) e
// devolve os limites em UTC, prontos para comparar com colunas timestamptz.

function partesDaData(fuso, data) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data)

  const porTipo = Object.fromEntries(partes.map((p) => [p.type, p.value]))
  return { ano: Number(porTipo.year), mes: Number(porTipo.month), dia: Number(porTipo.day) }
}

// GMT-3 -> -180 (minutos). Node ja embarca o ICU completo, entao qualquer
// fuso IANA valido funciona sem dependencia extra.
function offsetEmMinutos(fuso, data) {
  const nomeado = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(data)
    .find((p) => p.type === 'timeZoneName')?.value

  const combinado = /GMT([+-]\d+)(?::(\d+))?/.exec(nomeado ?? '')
  if (!combinado) return 0

  const horas = Number(combinado[1])
  const minutos = Number(combinado[2] ?? 0)
  return horas * 60 + (horas < 0 ? -minutos : minutos)
}

export function limitesDoDiaAtual(fuso, agora = new Date()) {
  const { ano, mes, dia } = partesDaData(fuso, agora)
  const offset = offsetEmMinutos(fuso, agora)

  const inicio = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0) - offset * 60_000)
  const fim = new Date(inicio.getTime() + 24 * 3_600_000)

  return { inicio, fim }
}
