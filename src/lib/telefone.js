// A API guarda o telefone so com digitos (DDD + numero), mas cadastro antigo
// pode vir formatado ou com o 55 na frente: tudo passa por aqui antes.
function digitos(telefone) {
  const numero = String(telefone ?? '').replace(/\D+/g, '')
  const comPais = (numero.length === 12 || numero.length === 13) && numero.startsWith('55')
  return comPais ? numero.slice(2) : numero
}

/**
 * Formata enquanto a pessoa digita: (47) 99999-8888 ou (47) 3333-4444.
 * Nunca termina em separador, senao o backspace apagaria o separador e a
 * mascara o devolveria na hora, travando o campo.
 */
export function mascararTelefone(valor) {
  const texto = String(valor ?? '')
  let numero = texto.replace(/\D+/g, '')
  // So tira o 55 de quem colou com "+55": um DDD 55 digitado tambem comeca assim.
  if (/^\s*\+\s*55/.test(texto)) numero = numero.slice(2)
  numero = numero.slice(0, 11)

  if (numero.length <= 2) return numero && `(${numero}`
  const ddd = numero.slice(0, 2)
  const resto = numero.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const corte = resto.length === 9 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

export function formatarTelefone(telefone) {
  const numero = digitos(telefone)
  if (numero.length === 10 || numero.length === 11) return mascararTelefone(numero)
  return telefone ?? ''
}

/** Link que abre a conversa no WhatsApp; null quando o numero nao tem DDD. */
export function linkWhatsapp(telefone) {
  const numero = digitos(telefone)
  if (numero.length !== 10 && numero.length !== 11) return null
  return `https://wa.me/55${numero}`
}
