import { z } from 'zod'

import { STATUS_ESTOQUE } from '../../shared/statusEstoque.js'

// RN06 so vale para quem precisa de reposicao: NORMAL fica fora do filtro.
const STATUS_REPOSICAO = STATUS_ESTOQUE.filter((status) => status !== 'NORMAL')

export const filtrosDeReposicao = z.object({
  fornecedorId: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS_REPOSICAO).optional(),
})
