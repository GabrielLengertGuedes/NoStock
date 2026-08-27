import { z } from 'zod'

const STATUS = ['NORMAL', 'BAIXO', 'CRITICO', 'SEM_ESTOQUE', 'PRECISA_REPOR']
const ORDENAVEIS = ['nome', 'quantidade', 'categoria']

export const filtrosDeListagem = z.object({
  busca: z.string().trim().min(1).max(150).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  fornecedorId: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS).optional(),
  ativo: z.enum(['true', 'false', 'todos']).optional().default('true'),
  pagina: z.coerce.number().int().positive().optional().default(1),
  porPagina: z.coerce.number().int().positive().max(100).optional().default(20),
  ordenarPor: z.enum(ORDENAVEIS).optional().default('nome'),
  ordem: z.enum(['asc', 'desc']).optional().default('asc'),
})
