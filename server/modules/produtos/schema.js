import { z } from 'zod'

export const parametroId = z.object({
  id: z.coerce.number().int().positive(),
})

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

const precoVenda = z.number({ error: 'Informe o preço' }).nonnegative('Não pode ser negativo')

const categoriaId = z
  .number({ error: 'Selecione uma categoria' })
  .int('Selecione uma categoria')
  .positive('Selecione uma categoria')

const fornecedorId = z
  .number()
  .int()
  .positive()
  .nullish()
  .transform((valor) => valor ?? null)

// Corpo JSON chega com o tipo certo: aqui e numero de verdade, nao precisa de coerce.
// Sem default: estoque minimo vazio virando 0 desligava o alerta de reposicao
// do produto sem ninguem perceber. Zero continua valendo, desde que digitado.
const quantidade = z
  .number({ error: 'Informe a quantidade' })
  .int('Use um número inteiro')
  .nonnegative('Não pode ser negativo')

export const corpoDeCriacao = z.object({
  nome,
  descricao,
  categoriaId,
  fornecedorId,
  precoVenda,
  estoqueInicial: quantidade,
  estoqueMinimo: quantidade,
  confirmarNomeDuplicado: z.boolean().optional().default(false),
})

// quantidadeAtual so existe aqui para ser recusada: o saldo muda por movimentacao,
// nunca pelo PUT (RN02, CA6.2). Precisa entrar no shape para nao ser descartado
// em silencio antes do superRefine conseguir ver que o campo foi enviado.
export const corpoDeAtualizacao = z
  .object({
    nome,
    descricao,
    categoriaId,
    fornecedorId,
    precoVenda,
    estoqueMinimo: quantidade,
    confirmarNomeDuplicado: z.boolean().optional().default(false),
    quantidadeAtual: z.unknown().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.quantidadeAtual !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantidadeAtual'],
        message: 'O saldo só pode ser alterado por uma movimentação',
      })
    }
  })
