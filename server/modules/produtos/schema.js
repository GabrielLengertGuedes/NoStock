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

const nome = z
  .string()
  .trim()
  .min(2, 'Informe ao menos 2 caracteres')
  .max(150, 'No máximo 150 caracteres')

const descricao = z
  .string()
  .trim()
  .max(500, 'No máximo 500 caracteres')
  .nullish()
  .transform((valor) => valor || null)

const precoVenda = z.number().nonnegative('Não pode ser negativo')

// Corpo JSON chega com o tipo certo: aqui e numero de verdade, nao precisa de coerce.
const quantidadeNaoNegativa = (mensagem) => z.number().int().nonnegative(mensagem).optional().default(0)

export const corpoDeCriacao = z.object({
  nome,
  descricao,
  categoriaId: z.number().int().positive(),
  fornecedorId: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((valor) => valor ?? null),
  precoVenda,
  estoqueInicial: quantidadeNaoNegativa('Não pode ser negativo'),
  estoqueMinimo: quantidadeNaoNegativa('Não pode ser negativo'),
  confirmarNomeDuplicado: z.boolean().optional().default(false),
})
