import { z } from 'zod'

import { NIVEIS } from './alerta.js'

// A API faz POST no endpoint que o aparelho manda. Aceitar qualquer endereco
// deixaria a API ser usada para chamar servidor de terceiros (SSRF), entao so
// passam os servicos de push dos navegadores. Com ponto na frente vale o dominio inteiro.
const SERVICOS_DE_PUSH = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  '.push.services.mozilla.com',
  '.notify.windows.com',
  '.push.apple.com',
]

export function enderecoDePushConhecido(texto) {
  let url
  try {
    url = new URL(texto)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false

  return SERVICOS_DE_PUSH.some((servico) =>
    servico.startsWith('.') ? url.hostname.endsWith(servico) : url.hostname === servico,
  )
}

const endpoint = z
  .string()
  .max(1000)
  .refine(enderecoDePushConhecido, 'Endereço de notificação não reconhecido')

export const corpoDaInscricao = z.object({
  endpoint,
  chaves: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
  nivel: z.enum(NIVEIS).optional().default('BAIXO'),
})

export const corpoComEndpoint = z.object({ endpoint })
