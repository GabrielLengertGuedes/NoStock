import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  CHAVE,
  enviarAlertaDeTeste,
  removerInscricao,
  salvarInscricao,
  useChavePublica,
  useInscricoes,
} from '../api/notificacoes.js'
import { abertoComoApp, chaveParaBytes, ehIOS, suportaPush } from '../lib/pwa.js'

function mensagemDe(falha) {
  if (falha?.mensagem) return falha.mensagem
  if (falha?.name === 'NotAllowedError') {
    return 'O navegador não deixou ativar. Confira se as notificações estão liberadas para este site.'
  }
  return 'Não foi possível concluir. Tente de novo.'
}

/**
 * Situação dos alertas push neste aparelho e as ações sobre eles.
 *
 * estado:
 * - carregando: ainda lendo o navegador e o servidor
 * - instalar: iPhone fora da Tela de Início, onde o Safari não oferece push
 * - sem-suporte: navegador sem push
 * - indisponivel: servidor sem as chaves VAPID
 * - bloqueado: a pessoa negou a permissão
 * - desligado / ligado
 */
export function useAlertasPush() {
  const cliente = useQueryClient()
  const suporte = suportaPush()
  const chave = useChavePublica({ enabled: suporte })
  const inscricoes = useInscricoes({ enabled: suporte })

  // undefined enquanto o navegador responde; null quando não há inscrição.
  const [assinatura, setAssinatura] = useState(undefined)
  const [permissao, setPermissao] = useState(() => (suporte ? Notification.permission : 'default'))
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!suporte) return undefined
    let ativo = true

    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager.getSubscription())
      .then((atual) => ativo && setAssinatura(atual))
      .catch(() => ativo && setAssinatura(null))

    return () => {
      ativo = false
    }
  }, [suporte])

  const doServidor = assinatura
    ? inscricoes.data?.find((inscricao) => inscricao.endpoint === assinatura.endpoint)
    : undefined

  let estado
  if (!suporte) estado = ehIOS() && !abertoComoApp() ? 'instalar' : 'sem-suporte'
  else if (chave.isPending || inscricoes.isPending || assinatura === undefined) estado = 'carregando'
  else if (!chave.data) estado = 'indisponivel'
  else if (permissao === 'denied') estado = 'bloqueado'
  else estado = assinatura && doServidor ? 'ligado' : 'desligado'

  async function executar(acao) {
    setOcupado(true)
    setErro(null)
    try {
      return (await acao()) !== false
    } catch (falha) {
      setErro(mensagemDe(falha))
      return false
    } finally {
      setOcupado(false)
      cliente.invalidateQueries({ queryKey: CHAVE })
    }
  }

  // Precisa partir do toque: o navegador recusa pedido de permissão que aparece sozinho.
  function ativar(nivel = 'BAIXO') {
    return executar(async () => {
      const resposta = await Notification.requestPermission()
      setPermissao(resposta)
      // Negou: o estado vira "bloqueado" e a tela explica. Fechou sem responder: segue desligado.
      if (resposta !== 'granted') return false

      const registro = await navigator.serviceWorker.ready
      const atual =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveParaBytes(chave.data),
        }))

      await salvarInscricao(atual, nivel)
      setAssinatura(atual)
    })
  }

  function mudarNivel(nivel) {
    return executar(() => salvarInscricao(assinatura, nivel))
  }

  // A sessão pode já ter caído: mesmo sem conseguir avisar o servidor, cancelar
  // no navegador mata o endpoint, e o servidor apaga a linha no próximo envio.
  function desativar() {
    return executar(async () => {
      if (!assinatura) return
      await removerInscricao(assinatura.endpoint).catch(() => {})
      await assinatura.unsubscribe()
      setAssinatura(null)
    })
  }

  function testar() {
    return executar(() => enviarAlertaDeTeste(assinatura.endpoint))
  }

  return {
    estado,
    nivel: doServidor?.nivel ?? null,
    ocupado,
    erro,
    ativar,
    mudarNivel,
    desativar,
    testar,
  }
}
