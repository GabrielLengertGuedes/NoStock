import { z } from 'zod'

export const corpoDoLogin = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
})

export const corpoDeTrocaDeSenha = z.object({
  senhaAtual: z.string().min(1, 'A senha atual é obrigatória'),
  senhaNova: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})
