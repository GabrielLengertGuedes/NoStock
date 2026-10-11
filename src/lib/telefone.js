// A API guarda o telefone so com digitos (DDD + numero), mas cadastro antigo
// pode vir formatado ou com o 55 na frente: tudo passa por aqui antes.
function digitos(telefone) {
  const numero = String(telefone ?? '').replace(/\D+/g, '')
  const comPais = (numero.length === 12 || numero.length === 13) && numero.startsWith('55')
  return comPais ? numero.slice(2) : numero
}

export function formatarTelefone(telefone) {
  const numero = digitos(telefone)
  if (numero.length === 11) return numero.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  if (numero.length === 10) return numero.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  return telefone ?? ''
}

/** Link que abre a conversa no WhatsApp; null quando o numero nao tem DDD. */
export function linkWhatsapp(telefone) {
  const numero = digitos(telefone)
  if (numero.length !== 10 && numero.length !== 11) return null
  return `https://wa.me/55${numero}`
}
