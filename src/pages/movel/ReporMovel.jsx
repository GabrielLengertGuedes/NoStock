import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useReposicao } from '../../api/reposicao.js'
import { BadgeStatus } from '../../components/BadgeStatus.jsx'
import { Chips } from '../../components/movel/Chips.jsx'
import { ContatoFornecedor } from '../../components/movel/ContatoFornecedor.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { formatarTelefone } from '../../lib/telefone.js'

const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'SEM_ESTOQUE', rotulo: 'Sem estoque' },
  { valor: 'CRITICO', rotulo: 'Críticos' },
  { valor: 'BAIXO', rotulo: 'Baixos' },
]

function plural(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

function Grupo({ grupo, abertoNoInicio }) {
  const [aberto, setAberto] = useState(abertoNoInicio)
  const { fornecedor } = grupo
  const contato = fornecedor
    ? [fornecedor.contatoNome, fornecedor.telefone ? formatarTelefone(fornecedor.telefone) : fornecedor.email]
    : []

  return (
    <details className="movel-grupo" open={aberto} onToggle={(evento) => setAberto(evento.currentTarget.open)}>
      <summary>
        <span className="movel-linha-texto">
          <span className="movel-grupo-nome">{fornecedor?.nome ?? 'Sem fornecedor definido'}</span>
          {fornecedor ? (
            <span className="movel-linha-meta">{contato.filter(Boolean).join(' · ')}</span>
          ) : (
            <span className="movel-grupo-dica">Cadastre o fornecedor na versão completa.</span>
          )}
        </span>
        <span className="movel-contagem">{plural(grupo.totalItens, 'item', 'itens')}</span>
      </summary>

      <ul>
        {grupo.itens.map((item) => (
          <li key={item.produtoId}>
            <Link to={`/m/produtos/${item.produtoId}`} className="movel-item">
              <span className="movel-linha-texto">
                <span className="movel-linha-nome">{item.nome}</span>
                <span className="movel-item-situacao">
                  <BadgeStatus status={item.statusEstoque} />
                  <span className="movel-linha-meta">
                    saldo {item.quantidadeAtual} · mín {item.estoqueMinimo}
                  </span>
                </span>
              </span>
              <span className="movel-comprar">{item.quantidadeSugerida} un</span>
            </Link>
          </li>
        ))}
      </ul>

      {fornecedor ? (
        <div className="movel-grupo-acoes">
          <ContatoFornecedor fornecedor={fornecedor} comRotulo />
        </div>
      ) : null}
    </details>
  )
}

function SugestaoDeCompra() {
  const [status, setStatus] = useState('')
  const consulta = useReposicao({ status: status || undefined })
  const grupos = consulta.data?.grupos ?? []
  const total = consulta.data?.totalItens ?? 0
  const fornecedores = grupos.filter((grupo) => grupo.fornecedor).length

  return (
    <LayoutMovel
      titulo="Repor"
      subtitulo={
        consulta.isPending
          ? 'Carregando…'
          : `${plural(total, 'item', 'itens')} · ${plural(fornecedores, 'fornecedor', 'fornecedores')}`
      }
    >
      <Chips rotulo="Filtrar por situação" opcoes={STATUS} valor={status} aoMudar={setStatus} />

      {consulta.isError ? (
        <p className="movel-erro" role="alert">
          {consulta.error.mensagem}
        </p>
      ) : consulta.isPending ? (
        <p className="movel-carregando">Carregando…</p>
      ) : total === 0 ? (
        <div className="movel-vazio">
          <strong>Estoque em dia</strong>
          Nenhum produto ativo está abaixo do estoque mínimo.
        </div>
      ) : (
        grupos.map((grupo, indice) => (
          <Grupo key={grupo.fornecedor?.id ?? 'sem-fornecedor'} grupo={grupo} abertoNoInicio={indice === 0} />
        ))
      )}

      <p className="movel-dica">A quantidade é a sugestão de compra: o dobro do mínimo, menos o saldo.</p>
    </LayoutMovel>
  )
}

/** Sugestão de compra agrupada por fornecedor. Só gestor, como no computador. */
export function ReporMovel() {
  const { temPapel } = useAuth()

  if (temPapel('GESTOR')) return <SugestaoDeCompra />

  return (
    <LayoutMovel titulo="Repor">
      <div className="movel-vazio">
        <strong>Área do gestor</strong>A sugestão de compra é restrita a gestores.
      </div>
    </LayoutMovel>
  )
}
