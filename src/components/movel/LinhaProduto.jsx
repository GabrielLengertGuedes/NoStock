import { Link } from 'react-router-dom'

import { BadgeStatus } from '../BadgeStatus.jsx'
import { ProdutoThumb } from '../ProdutoThumb.jsx'

/**
 * Produto numa lista do celular. O selo só aparece fora do OK: numa lista
 * inteira de selos verdes, os que pedem atenção somem.
 */
export function LinhaProduto({ produto }) {
  const atencao = produto.statusEstoque && produto.statusEstoque !== 'NORMAL'

  return (
    <Link to={`/m/produtos/${produto.id}`} className="movel-linha">
      <ProdutoThumb id={produto.id} nome={produto.nome} categoria={produto.categoria?.nome} />
      <span className="movel-linha-texto">
        <span className="movel-linha-nome">{produto.nome}</span>
        {atencao ? (
          <BadgeStatus status={produto.statusEstoque} />
        ) : (
          <span className="movel-linha-meta">{produto.categoria?.nome}</span>
        )}
      </span>
      <span className={`movel-qtd${produto.quantidadeAtual <= 0 ? ' movel-qtd-zero' : ''}`}>
        <strong>{produto.quantidadeAtual}</strong>
        <span>mín {produto.estoqueMinimo ?? 0}</span>
      </span>
    </Link>
  )
}
