import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDashboard } from '../../api/dashboard.js'
import { IconeAvancar } from '../../components/IconesBioma.jsx'
import { ConviteAlertas } from '../../components/movel/ConviteAlertas.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { LinhaProduto } from '../../components/movel/LinhaProduto.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { dataPorExtenso, saudacao } from '../../lib/datas.js'
import { primeiroNome } from '../../lib/estoqueMovel.js'

function Numero({ para, valor, rotulo, tom }) {
  return (
    <Link to={para} className={`movel-numero movel-numero-${valor > 0 ? tom : 'calmo'}`}>
      <strong>{valor ?? '–'}</strong>
      <span>
        {rotulo}
        <IconeAvancar size={14} />
      </span>
    </Link>
  )
}

/**
 * O que pede atenção agora. Lê o mesmo GET /dashboard dos cards e do sino do
 * computador, já ordenado por prioridade: sem estoque, crítico, baixo.
 */
export function InicioMovel() {
  const { usuario, temPapel } = useAuth()
  const dashboard = useDashboard()
  const [agora] = useState(() => new Date())

  const cards = dashboard.data?.cards
  const atencao = dashboard.data?.produtosAtencao ?? []
  const nome = primeiroNome(usuario?.nome)
  const precisaRepor = cards ? cards.estoqueBaixo + cards.semEstoque : null

  return (
    <LayoutMovel
      sobretitulo={dataPorExtenso(agora)}
      titulo={nome ? `${saudacao(agora)}, ${nome}` : saudacao(agora)}
      direita={
        <Link to="/m/conta" className="movel-avatar" aria-label="Sua conta e os alertas">
          {nome.charAt(0).toUpperCase() || '?'}
        </Link>
      }
      comRegistrar
    >
      {/* O alerta é sobre compra, tarefa do gestor; o operador liga pela Conta se quiser. */}
      {temPapel('GESTOR') ? <ConviteAlertas /> : null}

      <div className="movel-numeros">
        <Numero para="/m/estoque?status=SEM_ESTOQUE" valor={cards?.semEstoque} rotulo="Sem estoque" tom="zero" />
        <Numero para="/m/estoque?status=PRECISA_REPOR" valor={precisaRepor} rotulo="Precisa repor" tom="baixo" />
      </div>

      <p className="movel-hoje">
        <span>Hoje</span>
        <span>
          <strong>{cards?.entradasHoje ?? '–'}</strong> {cards?.entradasHoje === 1 ? 'entrada' : 'entradas'} ·{' '}
          <strong>{cards?.saidasHoje ?? '–'}</strong> {cards?.saidasHoje === 1 ? 'saída' : 'saídas'}
        </span>
      </p>

      <div className="movel-secao">
        <h2>Precisa de atenção</h2>
        {atencao.length > 0 ? <Link to="/m/estoque?status=PRECISA_REPOR">Ver todos</Link> : null}
      </div>

      {dashboard.isError ? (
        <p className="movel-erro" role="alert">
          {dashboard.error.mensagem}
        </p>
      ) : dashboard.isPending ? (
        <p className="movel-carregando">Carregando…</p>
      ) : atencao.length === 0 ? (
        <div className="movel-vazio">
          <strong>Tudo em dia</strong>
          Nenhum produto abaixo do estoque mínimo.
        </div>
      ) : (
        <ul className="movel-lista">
          {atencao.map((produto) => (
            <li key={produto.id}>
              <LinhaProduto produto={produto} />
            </li>
          ))}
        </ul>
      )}
    </LayoutMovel>
  )
}
