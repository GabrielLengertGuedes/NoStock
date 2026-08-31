import { z } from 'zod'

import { combinaTipoMotivo } from './tipoMotivo.js'

const TIPOS = ['ENTRADA', 'SAIDA', 'AJUSTE']
const MOTIVOS = [
  'COMPRA',
  'VENDA',
  'DESCARTE',
  'DEVOLUCAO',
  'ESTOQUE_INICIAL',
  'AJUSTE_INVENTARIO',
]

const observacao = z
  .string()
  .trim()
  .max(255, 'No máximo 255 caracteres')
  .nullish()
  .transform((valor) => valor || null)

// ESTOQUE_INICIAL só nasce no cadastro de produto (F1-10), não pela API de movimentação.
export const corpoDeRegistro = z
  .object({
    produtoId: z.number().int().positive(),
    tipo: z.enum(TIPOS),
    motivo: z.enum(MOTIVOS),
    quantidade: z.number().int(),
    observacao,
    usuarioId: z.unknown().optional(),
    criadoEm: z.unknown().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.motivo === 'ESTOQUE_INICIAL') {
      ctx.addIssue({
        code: 'custom',
        path: ['motivo'],
        message: 'Estoque inicial só é registrado no cadastro do produto',
      })
      return
    }

    if (!combinaTipoMotivo(dados.tipo, dados.motivo)) {
      ctx.addIssue({
        code: 'custom',
        path: ['motivo'],
        message: 'Motivo inválido para este tipo de movimentação',
      })
    }

    if (dados.tipo === 'AJUSTE') {
      if (dados.quantidade < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['quantidade'],
          message: 'Não pode ser negativo',
        })
      }
      return
    }

    if (dados.quantidade <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantidade'],
        message: 'Informe uma quantidade maior que zero',
      })
    }
  })
