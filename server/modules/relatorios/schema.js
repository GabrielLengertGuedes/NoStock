import { z } from 'zod'

// Diferente dos filtros de movimentacoes (onde de/ate sao opcionais), um
// relatorio de periodo exige as duas pontas: sem elas nao ha "periodo" a somar.
const dataIso = z.string().superRefine((valor, ctx) => {
  if (Number.isNaN(Date.parse(valor))) {
    ctx.addIssue({ code: 'custom', message: 'Data inválida' })
  }
})

function exigeOrdemDoPeriodo(dados, ctx) {
  if (new Date(dados.de) > new Date(dados.ate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['ate'],
      message: 'O fim do período deve ser posterior ao início',
    })
  }
}

export const filtrosDeResumo = z
  .object({
    de: dataIso,
    ate: dataIso,
  })
  .superRefine(exigeOrdemDoPeriodo)

export const filtrosDeRanking = z
  .object({
    de: dataIso,
    ate: dataIso,
    agrupar: z.enum(['categoria']),
    categoriaId: z.coerce.number().int().positive().optional(),
  })
  .superRefine(exigeOrdemDoPeriodo)
