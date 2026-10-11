/** Caracteres que contam num CNPJ: o alfanumerico (jul/2026) aceita letra. */
export const CARACTERE_CNPJ = /[0-9A-Z]/i

/**
 * Formata enquanto a pessoa digita: 00.000.000/0000-00, ou 12.ABC.345/01DE-35
 * no CNPJ alfanumerico. Como no telefone, o separador so aparece quando ja
 * existe caractere depois dele.
 */
export function mascararCnpj(valor) {
  let limpo = ''
  for (const caractere of String(valor ?? '').toUpperCase()) {
    if (limpo.length === 14) break
    // As 12 primeiras posicoes aceitam letra; os 2 digitos verificadores, so numero.
    const aceito = limpo.length < 12 ? CARACTERE_CNPJ : /\d/
    if (aceito.test(caractere)) limpo += caractere
  }

  let saida = limpo.slice(0, 2)
  if (limpo.length > 2) saida += `.${limpo.slice(2, 5)}`
  if (limpo.length > 5) saida += `.${limpo.slice(5, 8)}`
  if (limpo.length > 8) saida += `/${limpo.slice(8, 12)}`
  if (limpo.length > 12) saida += `-${limpo.slice(12)}`
  return saida
}
