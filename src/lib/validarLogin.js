// Mesmas regras do corpoDoLogin no servidor, checadas antes de enviar: o erro
// aparece no campo na hora, sem ida à API nem o genérico "Dados inválidos.".
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarLogin({ email, senha }) {
  const erros = {}
  const emailLimpo = email.trim()

  if (!emailLimpo) erros.email = 'Informe o e-mail.'
  else if (!FORMATO_EMAIL.test(emailLimpo)) erros.email = 'E-mail inválido. Confira o endereço.'

  if (!senha) erros.senha = 'Informe a senha.'

  return erros
}
