import { Link } from 'react-router-dom'

import { hora, quando } from '../../lib/datas.js'
import { ROTULO_MOTIVO, primeiroNome } from '../../lib/estoqueMovel.js'
import { IconeMenos, IconeSetaEntrada, IconeSetaSaida } from '../IconesBioma.jsx'

/**
 * Uma movimentação. O sinal sai da diferença de saldo, não do tipo: no ajuste
 * de inventário a quantidade é o saldo final, e só a diferença diz se entrou ou saiu.
 * No histórico mostra o produto e leva até ele; na tela do produto, mostra o motivo.
 */
export function LinhaMovimentacao({ movimentacao: mov, comProduto = false, agora }) {
  const diferenca = mov.saldoPosterior - mov.saldoAnterior
  const sentido = diferenca > 0 ? 'entrada' : diferenca < 0 ? 'saida' : 'ajuste'
  const Icone = { entrada: IconeSetaEntrada, saida: IconeSetaSaida, ajuste: IconeMenos }[sentido]
  const sinal = { entrada: '+', saida: '−', ajuste: '' }[sentido]

  const motivo = ROTULO_MOTIVO[mov.motivo] ?? mov.motivo
  const detalhe = comProduto
    ? [motivo, primeiroNome(mov.usuario?.nome), hora(mov.criadoEm)]
    : [primeiroNome(mov.usuario?.nome), quando(mov.criadoEm, agora)]

  const conteudo = (
    <>
      <span className={`movel-mov-icone movel-mov-${sentido}`} aria-hidden="true">
        <Icone size={16} />
      </span>
      <span className="movel-linha-texto">
        <span className="movel-linha-nome">{comProduto ? mov.produto?.nome : motivo}</span>
        <span className="movel-mov-detalhe">{detalhe.filter(Boolean).join(' · ')}</span>
      </span>
      <span className={`movel-mov-qtd movel-mov-qtd-${sentido}`}>
        {sinal}
        {Math.abs(diferenca)}
        <span>
          {mov.saldoAnterior} → {mov.saldoPosterior}
        </span>
      </span>
    </>
  )

  if (comProduto) {
    return (
      <Link to={`/m/produtos/${mov.produtoId}`} className="movel-mov">
        {conteudo}
      </Link>
    )
  }
  return <div className="movel-mov">{conteudo}</div>
}
