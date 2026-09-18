import { useMemo, useState } from 'react'

import {
  useCategoriasRelatorio,
  useGiroRelatorio,
  useRankingRelatorio,
  useResumoRelatorio,
} from '../api/relatorios.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { IconeMovimentacoes, IconeProdutos, IconeRelatorios } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const NUMERO = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const VISOES_RANKING = [
  { valor: 'agrupado', rotulo: 'Agrupado por categoria' },
  { valor: 'lista', rotulo: 'Lista geral' },
]

function paraDiaLocal(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// O usuario escolhe o dia; o periodo enviado a API vai do primeiro ao ultimo
// instante dele (senao o dia final fica de fora), resolvido no fuso de quem
// esta na tela — o mesmo padrao usado no filtro de Movimentações.
function instante(dia, hora) {
  if (!dia) return undefined
  const data = new Date(`${dia}T${hora}`)
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString()
}

function periodoPadrao() {
  const hoje = new Date()
  const trintaDiasAtras = new Date(hoje)
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 29)
  return { de: paraDiaLocal(trintaDiasAtras), ate: paraDiaLocal(hoje) }
}

const COLUNAS_RANKING_LISTA = [
  { chave: 'nome', titulo: 'Produto' },
  { chave: 'categoria', titulo: 'Categoria', render: (p) => p.categoria.nome },
  { chave: 'unidades', titulo: 'Unidades vendidas', alinhamento: 'right' },
  { chave: 'receita', titulo: 'Receita', alinhamento: 'right', render: (p) => MOEDA.format(p.receita) },
]

const COLUNAS_RANKING_CATEGORIA = [
  { chave: 'nome', titulo: 'Produto' },
  { chave: 'unidades', titulo: 'Unidades vendidas', alinhamento: 'right' },
  { chave: 'receita', titulo: 'Receita', alinhamento: 'right', render: (p) => MOEDA.format(p.receita) },
]

const COLUNAS_DISTRIBUICAO = [
  { chave: 'nome', titulo: 'Categoria' },
  { chave: 'produtos', titulo: 'Produtos', alinhamento: 'right' },
  { chave: 'unidades', titulo: 'Unidades em estoque', alinhamento: 'right' },
  {
    chave: 'valorImobilizado',
    titulo: 'Valor imobilizado',
    alinhamento: 'right',
    render: (c) => MOEDA.format(c.valorImobilizado),
  },
]

export function Relatorios() {
  const menu = useMenuPrincipal()
  const [periodo, setPeriodo] = useState(periodoPadrao)
  const [visaoRanking, setVisaoRanking] = useState('agrupado')

  const de = instante(periodo.de, '00:00:00.000')
  const ate = instante(periodo.ate, '23:59:59.999')

  const resumo = useResumoRelatorio({ de, ate })
  const giro = useGiroRelatorio({ de, ate })
  const ranking = useRankingRelatorio({ de, ate })
  const distribuicao = useCategoriasRelatorio()

  const categoriasRanking = ranking.data?.categorias ?? []
  const listaGeralRanking = useMemo(() => {
    const linhas = categoriasRanking.flatMap((grupo) =>
      grupo.produtos.map((produto) => ({ ...produto, categoria: grupo.categoria })),
    )
    return linhas.sort((a, b) => b.unidades - a.unidades || b.receita - a.receita)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categoriasRanking deriva de ranking.data
  }, [ranking.data])

  function mudarPeriodo(campo, valor) {
    setPeriodo((atual) => ({ ...atual, [campo]: valor }))
  }

  return (
    <Layout
      titulo="Relatórios"
      subtitulo="Indicadores gerenciais de vendas e estoque para o período selecionado."
      menu={menu}
    >
      <section className="filtros-bioma" aria-label="Período do relatório">
        <div className="filtros-bioma-topo">
          <div>
            <h2 className="text-h3">Período</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Total vendido, giro de estoque e ranking de produtos são calculados dentro dele.
            </p>
          </div>
        </div>

        <div className="filtros-bioma-campos">
          <Campo
            id="relatorios-de"
            rotulo="De"
            type="date"
            value={periodo.de}
            max={periodo.ate || undefined}
            onChange={(evento) => mudarPeriodo('de', evento.target.value)}
          />
          <Campo
            id="relatorios-ate"
            rotulo="Até"
            type="date"
            value={periodo.ate}
            min={periodo.de || undefined}
            onChange={(evento) => mudarPeriodo('ate', evento.target.value)}
          />
        </div>
      </section>

      {(resumo.isError || giro.isError) && (
        <p className="campo-erro text-body" role="alert">
          {resumo.error?.mensagem ?? giro.error?.mensagem}
        </p>
      )}

      <section className="kpi-grid kpi-grid-3" aria-label="Indicadores do período">
        <KpiCard
          tom="neutro"
          Icone={IconeMovimentacoes}
          rotulo="Total vendido"
          valor={resumo.isPending ? '—' : MOEDA.format(resumo.data?.totalVendido ?? 0)}
          meta="Preço registrado em cada venda (histórico, RN09)"
        />
        <KpiCard
          tom="mint"
          Icone={IconeProdutos}
          rotulo="Unidades vendidas"
          valor={resumo.isPending ? '—' : (resumo.data?.unidadesVendidas ?? 0)}
          meta="No período selecionado"
        />
        <KpiCard
          tom="alerta"
          Icone={IconeRelatorios}
          rotulo="Giro de estoque"
          valor={giro.isPending ? '—' : NUMERO.format(giro.data?.geral?.giro ?? 0)}
          meta={giro.data?.formula ?? 'Unidades vendidas ÷ quantidade em estoque atual'}
        />
      </section>

      <section className="painel" aria-label="Ranking de produtos">
        <div className="painel-cabecalho">
          <div>
            <h2 className="text-h3">Ranking de produtos</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Produtos mais vendidos no período, por unidades.
            </p>
          </div>
          <div className="segmented" role="tablist" aria-label="Agrupamento do ranking">
            {VISOES_RANKING.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                role="tab"
                aria-selected={visaoRanking === opcao.valor}
                className={`segmented-btn${visaoRanking === opcao.valor ? ' segmented-btn-ativo' : ''}`}
                onClick={() => setVisaoRanking(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>

        {ranking.isError && (
          <p className="campo-erro text-body" role="alert">
            {ranking.error.mensagem}
          </p>
        )}

        {categoriasRanking.length === 0 ? (
          <Tabela
            colunas={COLUNAS_RANKING_LISTA}
            dados={[]}
            carregando={ranking.isPending}
            vazio={
              <EstadoVazio
                titulo="Nenhuma venda no período"
                descricao="Ajuste o período para ver o ranking de produtos vendidos."
              />
            }
          />
        ) : visaoRanking === 'lista' ? (
          <Tabela colunas={COLUNAS_RANKING_LISTA} dados={listaGeralRanking} carregando={ranking.isPending} />
        ) : (
          <div className="flex flex-col gap-base">
            {categoriasRanking.map((grupo) => (
              <div key={grupo.categoria.id}>
                <h3 className="text-body" style={{ fontWeight: 700, marginBottom: 8 }}>
                  {grupo.categoria.nome}
                </h3>
                <Tabela colunas={COLUNAS_RANKING_CATEGORIA} dados={grupo.produtos} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="painel" aria-label="Distribuição por categoria">
        <div className="painel-cabecalho">
          <div>
            <h2 className="text-h3">Distribuição por categoria</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Unidades e valor imobilizado no estoque atual, por categoria.
            </p>
          </div>
        </div>

        {distribuicao.isError && (
          <p className="campo-erro text-body" role="alert">
            {distribuicao.error.mensagem}
          </p>
        )}

        <Tabela
          colunas={COLUNAS_DISTRIBUICAO}
          dados={distribuicao.data?.categorias ?? []}
          carregando={distribuicao.isPending}
          vazio={
            <EstadoVazio
              titulo="Nenhuma categoria cadastrada"
              descricao="Cadastre categorias e produtos para ver a distribuição do estoque."
            />
          }
        />
      </section>
    </Layout>
  )
}
