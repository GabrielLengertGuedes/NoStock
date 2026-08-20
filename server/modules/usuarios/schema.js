import { z } from 'zod'

export const parametroId = z.object({
  id: z.coerce.number().int().positive(),
})

export const filtrosDeListagem = z.object({
  ativo: z.enum(['true', 'false', 'todos']).optional().default('true'),
})

const nome = z
  .string()
  .trim()
  .min(3, 'Informe ao menos 3 caracteres')
  .max(120, 'No máximo 120 caracteres')

const email = z.string().trim().toLowerCase().email('E-mail inválido')

const senha = z.string().min(8, 'A senha deve ter no mínimo 8 caracteres')

const papel = z.enum(['OPERADOR', 'GESTOR'])

export const corpoDeCriacao = z.object({
  nome,
  email,
  senha,
  papel,
})

export const corpoDeAtualizacao = z.object({
  nome,
  email,
  papel,
})

export const corpoDeNovaSenha = z.object({
  senhaNova: senha,
})
