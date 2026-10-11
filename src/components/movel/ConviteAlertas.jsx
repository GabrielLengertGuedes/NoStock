import { useState } from 'react'

import { useAlertasPush } from '../../hooks/useAlertasPush.js'
import { useToast } from '../../hooks/useToast.js'
import { IconeSino } from '../IconesBioma.jsx'
import { PassosInstalarIOS } from './PassosInstalarIOS.jsx'

const CHAVE_DISPENSADO = 'nostock-convite-alertas-dispensado'

function lerDispensado() {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO) === '1'
  } catch {
    return false
  }
}

/**
 * Convite do Início para ligar os alertas neste celular. Some quando eles já
 * estão ligados ou quando a pessoa dispensa; a tela Conta continua com a opção.
 */
export function ConviteAlertas() {
  const alertas = useAlertasPush()
  const toast = useToast()
  const [dispensado, setDispensado] = useState(lerDispensado)

  const instalar = alertas.estado === 'instalar'
  if (dispensado || !(instalar || alertas.estado === 'desligado')) return null

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, '1')
    } catch {
      // sem storage o convite só volta na próxima visita
    }
    setDispensado(true)
  }

  async function ativar() {
    if (await alertas.ativar('BAIXO')) {
      toast.mostrar({ titulo: 'Alertas ligados', mensagem: 'Você vai saber quando um produto precisar de reposição.' })
    }
  }

  return (
    <section className="movel-convite" aria-labelledby="convite-alertas-titulo">
      <div className="movel-convite-topo">
        <span className="movel-convite-icone" aria-hidden="true">
          <IconeSino size={20} />
        </span>
        <h2 id="convite-alertas-titulo">
          {instalar ? 'Receba os alertas no iPhone' : 'Saiba na hora quando um produto acabar'}
        </h2>
      </div>

      {instalar ? (
        <>
          <p>No iPhone, os alertas só chegam com o app na Tela de Início.</p>
          <PassosInstalarIOS />
        </>
      ) : (
        <p>Ative os alertas neste celular. Avisamos quando um produto ficar abaixo do mínimo, crítico ou acabar.</p>
      )}

      {alertas.erro ? (
        <p className="movel-convite-erro" role="alert">
          {alertas.erro}
        </p>
      ) : null}

      <div className="movel-convite-acoes">
        {instalar ? null : (
          <button type="button" className="movel-botao movel-botao-primario" onClick={ativar} disabled={alertas.ocupado}>
            {alertas.ocupado ? 'Ativando…' : 'Ativar alertas'}
          </button>
        )}
        <button type="button" className="movel-botao movel-botao-texto" onClick={dispensar}>
          Agora não
        </button>
      </div>
    </section>
  )
}
