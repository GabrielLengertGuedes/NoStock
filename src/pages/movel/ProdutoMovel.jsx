import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useMovimentacoes } from '../../api/movimentacoes.js'
import { useProduto } from '../../api/produtos.js'
import { BadgeStatus } from '../../components/BadgeStatus.jsx'
import { IconeMenos, IconePlus } from '../../components/IconesBioma.jsx'
import { ContatoFornecedor } from '../../components/movel/ContatoFornecedor.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { LinhaMovimentacao } from '../../components/movel/LinhaMovimentacao.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useRegistroMovel } from '../../hooks/useRegistroMovel.js'
import { quantidadeSugerida } from '../../lib/estoqueMovel.js'
import { formatarTelefone } from '../../lib/telefone.js'

const VOLTAR = { rotulo: 'Estoque', para: '/m/estoque' }

// A régua vai de zero ao dobro do mínimo, que é até onde a sugestão de compra leva.
function Regua({ saldo, minimo, status }) {
  if (!minimo) return null
  const ideal = minimo * 2
  const preenchido = Math.min(100, (saldo / ideal) * 100)

  return (
    <>
      <div className="movel-regua" aria-hidden="true">
        <span className={`movel-regua-saldo movel-regua-${status}`} style={{ width: `${preenchido}%` }} />
        <span className="movel-regua-minimo" />
      </div>
      <div className="movel-regua-legenda" aria-hidden="true">
        <span>0</span>
        <span>mínimo {minimo}</span>
        <span>{ideal}</span>
      </div>
    </>
  )
}

function Fornecedor({ fornecedor }) {
  if (!fornecedor) {
    return (
      <div className="movel-cartao">
        <p className="movel-rotulo">Fornecedor</p>
        <p className="movel-dica">Sem fornecedor definido. Dá para cadastrar na versão completa.</p>
      </div>
    )
  }

  const contato = [fornecedor.contatoNome, fornecedor.telefone ? formatarTelefone(fornecedor.telefone) : fornecedor.email]

  return (
    <div className="movel-cartao movel-fornecedor">
      <div className="movel-linha-texto">
        <p className="movel-rotulo">Fornecedor</p>
        <p className="movel-fornecedor-nome">{fornecedor.nome}</p>
        <p className="movel-linha-meta">{contato.filter(Boolean).join(' · ')}</p>
      </div>
      <ContatoFornecedor fornecedor={fornecedor} />
    </div>
  )
}

/** Tela nova: no computador o produto só aparece como linha de tabela. */
export function ProdutoMovel() {
  const { id } = useParams()
  const { temPapel } = useAuth()
  const { abrir } = useRegistroMovel()
  const [agora] = useState(() => new Date())

  const consulta = useProduto(id)
  const historico = useMovimentacoes({ produtoId: id, pagina: 1, porPagina: 5 })
  const produto = consulta.data

  if (!produto) {
    return (
      <LayoutMovel voltar={VOLTAR} titulo="Produto">
        {consulta.isError ? (
          <p className="movel-erro" role="alert">
            {consulta.error.mensagem}
          </p>
        ) : (
          <p className="movel-carregando">Carregando…</p>
        )}
      </LayoutMovel>
    )
  }

  const { quantidadeAtual: saldo, estoqueMinimo: minimo, statusEstoque: status } = produto
  const movimentacoes = historico.data?.dados ?? []

  const rodape = produto.ativo ? (
    <>
      <button
        type="button"
        className="movel-botao movel-botao-secundario"
        onClick={() => abrir({ tipo: 'SAIDA', produto })}
        disabled={saldo <= 0}
      >
        <IconeMenos size={18} />
        Saída
      </button>
      <button type="button" className="movel-botao movel-botao-primario" onClick={() => abrir({ tipo: 'ENTRADA', produto })}>
        <IconePlus size={18} />
        Entrada
      </button>
    </>
  ) : null

  return (
    <LayoutMovel voltar={VOLTAR} sobretitulo={produto.categoria?.nome} titulo={produto.nome} rodape={rodape}>
      {!produto.ativo ? (
        <p className="movel-aviso">Este produto saiu do catálogo. O histórico dele continua aqui.</p>
      ) : null}

      <section className="movel-cartao" aria-label="Saldo em estoque">
        <div className="movel-saldo-topo">
          <p className={`movel-saldo movel-saldo-${status}`}>
            {saldo}
            <small>un</small>
          </p>
          <BadgeStatus status={status} />
        </div>
        <Regua saldo={saldo} minimo={minimo} status={status} />
      </section>

      {temPapel('GESTOR') && status !== 'NORMAL' ? (
        <p className="movel-sugestao">
          <span>
            Sugestão de compra
            <br />
            o dobro do mínimo, menos o saldo
          </span>
          <strong>{quantidadeSugerida(minimo, saldo)} un</strong>
        </p>
      ) : null}

      <Fornecedor fornecedor={produto.fornecedor} />

      <div className="movel-secao">
        <h2>Últimas movimentações</h2>
      </div>
      {historico.isPending ? (
        <p className="movel-carregando">Carregando…</p>
      ) : movimentacoes.length === 0 ? (
        <div className="movel-vazio">Nenhuma movimentação ainda.</div>
      ) : (
        <ul className="movel-lista">
          {movimentacoes.map((movimentacao) => (
            <li key={movimentacao.id}>
              <LinhaMovimentacao movimentacao={movimentacao} agora={agora} />
            </li>
          ))}
        </ul>
      )}
    </LayoutMovel>
  )
}
