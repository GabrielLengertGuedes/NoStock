import { useState } from 'react'

import { useFornecedores } from '../api/fornecedores.js'
import { useReposicao } from '../api/reposicao.js'
import { BadgeStatus } from '../components/BadgeStatus.jsx'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const ABAS_STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'SEM_ESTOQUE', rotulo: 'Sem estoque' },
  { valor: 'CRITICO', rotulo: 'Críticos' },
  { valor: 'BAIXO', rotulo: 'Baixos' },
]

const COLUNAS_ITENS = [
  { chave: 'nome', titulo: 'Produto' },
  { chave: 'quantidadeAtual', titulo: 'Saldo atual', alinhamento: 'right' },
  { chave: 'estoqueMinimo', titulo: 'Estoque mínimo', alinhamento: 'right' },
  {
    chave: 'statusEstoque',
    titulo: 'Status',
    render: (item) => <BadgeStatus status={item.statusEstoque} />,
  },
  {
    chave: 'quantidadeSugerida',
    titulo: 'Sugestão de compra',
    alinhamento: 'right',
    render: (item) => <strong>{item.quantidadeSugerida} un.</strong>,
  },
]

export function Reposicao() {
  const menu = useMenuPrincipal()
  const fornecedores = useFornecedores()

  const [filtros, setFiltros] = useState({ fornecedorId: '', status: '' })

  const consulta = useReposicao({
    fornecedorId: filtros.fornecedorId || undefined,
    status: filtros.status || undefined,
  })

  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
  }

  const grupos = consulta.data?.grupos ?? []
  const totalItens = consulta.data?.totalItens ?? 0

  return (
    <Layout
      titulo="Sugestão de compra"
      subtitulo="Itens a repor, agrupados por fornecedor, com a quantidade sugerida."
      menu={menu}
      acoes={
        totalItens > 0 ? (
          <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
            Imprimir / Exportar
          </button>
        ) : null
      }
    >
      <div className="filtros-linha no-print">
        <div className="segmented" role="tablist" aria-label="Filtro por status">
          {ABAS_STATUS.map((aba) => (
            <button
              key={aba.valor || 'todos'}
              type="button"
              role="tab"
              aria-selected={filtros.status === aba.valor}
              className={`segmented-btn${filtros.status === aba.valor ? ' segmented-btn-ativo' : ''}`}
              onClick={() => mudarFiltro('status', aba.valor)}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        <Campo id="reposicao-fornecedor" rotulo="Fornecedor">
          <select
            id="reposicao-fornecedor"
            className="input-field"
            value={filtros.fornecedorId}
            onChange={(e) => mudarFiltro('fornecedorId', e.target.value)}
          >
            <option value="">Todos os fornecedores</option>
            {(fornecedores.data ?? []).map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <section className="kpi-grid kpi-grid-3" aria-label="Resumo da reposição">
        <KpiCard
          tom={totalItens > 0 ? 'urgente' : 'mint'}
          rotulo="Itens a repor"
          valor={consulta.isPending ? '—' : totalItens}
          meta="No filtro atual"
        />
        <KpiCard
          tom="neutro"
          rotulo="Fornecedores envolvidos"
          valor={consulta.isPending ? '—' : grupos.filter((g) => g.fornecedor !== null).length}
          meta="Com item a repor"
        />
      </section>

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      {consulta.isPending ? (
        <p className="text-body" style={{ color: 'var(--gray)' }}>
          Carregando sugestão de compra…
        </p>
      ) : totalItens === 0 ? (
        <EstadoVazio
          titulo="Estoque em dia"
          descricao="Nenhum produto ativo está abaixo do estoque mínimo no momento."
        />
      ) : (
        grupos.map((grupo) => (
          <section
            key={grupo.fornecedor?.id ?? 'sem-fornecedor'}
            className="painel reposicao-grupo"
            aria-label={`Itens de ${grupo.fornecedor?.nome ?? 'sem fornecedor definido'}`}
          >
            <div className="reposicao-grupo-cabecalho">
              <div>
                <h2 className="text-h3">{grupo.fornecedor?.nome ?? 'Sem fornecedor definido'}</h2>
                {grupo.fornecedor ? (
                  <div className="catalogo-contato">
                    <span>{grupo.fornecedor.contatoNome || 'Sem contato cadastrado'}</span>
                    {grupo.fornecedor.telefone ? (
                      <a href={`tel:${grupo.fornecedor.telefone}`}>{grupo.fornecedor.telefone}</a>
                    ) : null}
                    {grupo.fornecedor.email ? (
                      <a href={`mailto:${grupo.fornecedor.email}`}>{grupo.fornecedor.email}</a>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
                    Cadastre o fornecedor destes produtos para agrupar a compra.
                  </p>
                )}
              </div>
              <span className="kpi-pill kpi-pill-warn">
                {grupo.totalItens} {grupo.totalItens === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <Tabela
              colunas={COLUNAS_ITENS}
              dados={grupo.itens}
              chaveDaLinha={(item) => item.produtoId}
            />
          </section>
        ))
      )}
    </Layout>
  )
}
