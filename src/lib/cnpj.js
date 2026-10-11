/**
 * Formata enquanto a pessoa digita: 00.000.000/0000-00. Como no telefone,
 * o separador so aparece quando ja existe digito depois dele.
 */
export function mascararCnpj(valor) {
  const numero = String(valor ?? '').replace(/\D+/g, '').slice(0, 14)

  let saida = numero.slice(0, 2)
  if (numero.length > 2) saida += `.${numero.slice(2, 5)}`
  if (numero.length > 5) saida += `.${numero.slice(5, 8)}`
  if (numero.length > 8) saida += `/${numero.slice(8, 12)}`
  if (numero.length > 12) saida += `-${numero.slice(12)}`
  return saida
}
