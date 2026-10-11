function contar(texto, aceita) {
  return [...texto].filter((c) => aceita.test(c)).length
}

/**
 * Onde o cursor deve ficar depois da mascara: conta quantos caracteres que
 * contam (digito, letra do CNPJ) havia antes do cursor no texto digitado e
 * para logo depois do mesmo numero deles no texto formatado. Os separadores
 * que a mascara poe ou tira no caminho nao empurram o cursor.
 */
export function cursorAposMascara({ digitado, cursor, formatado, aceita }) {
  let restantes = contar(digitado.slice(0, cursor), aceita)
  if (restantes === 0) return 0

  for (let i = 0; i < formatado.length; i++) {
    if (aceita.test(formatado[i])) restantes--
    if (restantes === 0) return i + 1
  }
  return formatado.length
}

/**
 * Valor e cursor depois de uma edicao. `inserido` e o que a pessoa digitou
 * (null quando colou ou apagou): se a mascara teve que descartar caractere,
 * a tecla e ignorada. Sem isso, digitar no meio de um telefone completo
 * empurrava o ultimo digito para fora e o numero ficava errado sem aviso.
 */
export function aplicarMascara({ digitado, cursor, anterior = '', inserido, mascarar, aceita }) {
  const formatado = mascarar(digitado)

  if (inserido != null && contar(digitado, aceita) > contar(formatado, aceita)) {
    return { valor: anterior, cursor: Math.max(0, cursor - inserido.length) }
  }
  return { valor: formatado, cursor: cursorAposMascara({ digitado, cursor, formatado, aceita }) }
}
