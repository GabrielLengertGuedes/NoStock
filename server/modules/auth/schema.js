import { z } from 'zod'

import { senha } from '../usuarios/schema.js'

export const corpoDoLogin = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
})

export const corpoDeTrocaDeSenha = z.object({
  senhaAtual: z.string().min(1, 'A senha atual é obrigatória'),
  senhaNova: senha,
})
