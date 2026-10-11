import webpush from 'web-push'

import { obterEnv } from '../../config/env.js'

// Aparelho desligado por mais tempo que isso nao recebe alerta velho quando voltar.
const VALIDADE_SEGUNDOS = 12 * 3600

export function pushConfigurado() {
  return obterEnv().vapid !== null
}

/**
 * Entrega um alerta a um aparelho. Nunca lanca: devolve 'enviado', 'expirada'
 * (o aparelho desinstalou o app ou revogou a permissao) ou 'falhou'.
 */
export async function enviar(inscricao, alerta) {
  const { vapid } = obterEnv()

  try {
    await webpush.sendNotification(
      {
        endpoint: inscricao.endpoint,
        keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
      },
      JSON.stringify(alerta),
      {
        vapidDetails: {
          subject: vapid.contato,
          publicKey: vapid.chavePublica,
          privateKey: vapid.chavePrivada,
        },
        TTL: VALIDADE_SEGUNDOS,
        urgency: 'high',
        // Alerta do mesmo produto ainda nao entregue e trocado pelo novo no servico de push.
        topic: alerta.tag,
        timeout: 10_000,
      },
    )
    return 'enviado'
  } catch (erro) {
    if (erro.statusCode === 404 || erro.statusCode === 410) return 'expirada'
    console.error(
      `Falha ao enviar alerta push (${erro.statusCode ?? 'sem resposta'}):`,
      erro.body || erro.message,
    )
    return 'falhou'
  }
}
