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

function validarCnpj(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false

  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  let digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--
    if (pos < 2) pos = 9
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado != digitos.charAt(0)) return false

  tamanho = tamanho + 1
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--
    if (pos < 2) pos = 9
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado != digitos.charAt(1)) return false

  return true
}

const cnpj = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d]+/g, ''))
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

const telefone = z
  .string()
  .trim()
  .max(20, 'No máximo 20 caracteres')
  .nullish()
  .transform((valor) => valor || null)

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

export const corpoDeCriacao = z.object({
  nome,
  cnpj,
  contato_nome,
  telefone,
  email,
  observacao,
})

export const corpoDeAtualizacao = z.object({
  nome,
  cnpj,
  contato_nome,
  telefone,
  email,
  observacao,
})
