import { z } from 'zod'

export const corpoDoLogin = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
})
