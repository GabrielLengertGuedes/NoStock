import { z } from 'zod'

export const parametroId = z.object({
  id: z.coerce.number().int().positive(),
})

export const filtrosDeListagem = z.object({
  // Query string chega sempre como texto: "false" tambem e um texto verdadeiro.
  incluirInativas: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
})

const nome = z
  .string()
  .trim()
  .min(2, 'Informe ao menos 2 caracteres')
  .max(80, 'No máximo 80 caracteres')

const descricao = z
  .string()
  .trim()
  .max(255, 'No máximo 255 caracteres')
  .nullish()
  .transform((valor) => valor || null)

export const corpoDeCriacao = z.object({ nome, descricao })

export const corpoDeAtualizacao = z.object({ nome, descricao })
