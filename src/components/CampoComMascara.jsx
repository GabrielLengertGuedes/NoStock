import { aplicarMascara } from '../lib/mascara.js'
import { Campo } from './Campo.jsx'

/**
 * Campo que formata enquanto a pessoa digita sem jogar o cursor para o fim:
 * quem corrige um caractere no meio continua digitando no mesmo lugar.
 */
export function CampoComMascara({ mascarar, aceita, aoMudar, value, ...props }) {
  function aoDigitar(evento) {
    const campo = evento.target
    const { inputType, data } = evento.nativeEvent
    const { valor, cursor } = aplicarMascara({
      digitado: campo.value,
      cursor: campo.selectionStart,
      anterior: value,
      inserido: inputType === 'insertText' ? data : null,
      mascarar,
      aceita,
    })

    // O cursor pula para o fim quando o React regrava o valor do campo. Gravando
    // o texto formatado e o cursor aqui mesmo, no render o valor ja confere e o
    // React nao mexe em nada.
    campo.value = valor
    campo.setSelectionRange(cursor, cursor)
    if (valor !== value) aoMudar(valor)
  }

  return <Campo {...props} value={value} onChange={aoDigitar} />
}
