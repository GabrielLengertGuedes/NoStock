import { z } from 'zod'

export const parametroId = z.object({
  id: z.coerce.number().int().positive(),
})

export const filtrosDeListagem = z.object({
  incluirInativos: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
})

// Desde julho de 2026 a Receita emite CNPJ alfanumerico: as 12 primeiras
// posicoes aceitam letra e os 2 digitos verificadores seguem numericos. No
// calculo cada caractere vale o codigo ASCII menos 48 ('0' = 0, 'A' = 17), o
// que mantem o CNPJ so de numeros com o mesmo resultado de antes.
function digitoVerificador(base) {
  let soma = 0
  let peso = 2
  for (let i = base.length - 1; i >= 0; i--) {
    soma += (base.charCodeAt(i) - 48) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

function validarCnpj(cnpj) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1+$/.test(cnpj)) return false

  const primeiro = digitoVerificador(cnpj.slice(0, 12))
  const segundo = digitoVerificador(cnpj.slice(0, 12) + primeiro)
  return cnpj.endsWith(`${primeiro}${segundo}`)
}

const cnpj = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase().replace(/[^0-9A-Z]+/g, ''))
  .refine((v) => v === '' || validarCnpj(v), 'CNPJ inválido')
  .transform((v) => (v === '' ? null : v))
  .nullish()

const nome = z
  .string()
  .trim()
  .min(2, 'Informe ao menos 2 caracteres')
  .max(120, 'No máximo 120 caracteres')

const contato_nome = z
  .string()
  .trim()
  .max(120, 'No máximo 120 caracteres')
  .nullish()
  .transform((valor) => valor || null)

// Guardado so com digitos (DDD + numero), como o CNPJ. O 55 de quem cola
// o numero com codigo do pais sai aqui; o link do WhatsApp poe de volta.
function digitosDoTelefone(valor) {
  const digitos = valor.replace(/\D+/g, '')
  const comPais = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
  return comPais ? digitos.slice(2) : digitos
}

const telefone = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || [10, 11].includes(digitosDoTelefone(v).length),
    'Informe o telefone com DDD',
  )
  .transform((v) => digitosDoTelefone(v) || null)
  .nullish()

const email = z
  .string()
  .trim()
  .email('E-mail inválido')
  .max(180, 'No máximo 180 caracteres')
  .nullish()
  .or(z.literal('')) // handle empty string as nullish too
  .transform((valor) => (!valor ? null : valor))

const observacao = z
  .string()
  .trim()
  .max(255, 'No máximo 255 caracteres')
  .nullish()
  .transform((valor) => valor || null)

// Fornecedor sem nenhum canal deixa a sugestao de compra (RF13) sem ter para
// quem ligar: telefone ou e-mail, ao menos um.
function exigirTelefoneOuEmail(dados, ctx) {
  if (dados.telefone || dados.email) return

  for (const campo of ['telefone', 'email']) {
    ctx.addIssue({ code: 'custom', path: [campo], message: 'Informe um telefone ou um e-mail' })
  }
}

const corpo = z
  .object({
    nome,
    cnpj,
    contato_nome,
    telefone,
    email,
    observacao,
  })
  .superRefine(exigirTelefoneOuEmail)

export const corpoDeCriacao = corpo

export const corpoDeAtualizacao = corpo
