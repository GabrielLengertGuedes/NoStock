import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useMovimentacoes } from '../api/movimentacoes.js'
import { useProdutos } from '../api/produtos.js'
import { useUsuarios } from '../api/usuarios.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { IconeAlerta, IconeMovimentacoes, IconeProdutos } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { ModalMovimentacao } from '../components/ModalMovimentacao.jsx'
import { Paginacao } from '../components/Paginacao.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { skuDoProduto } from '../lib/sku.js'

const TIPOS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'ENTRADA', rotulo: 'Entrada' },
  { valor: 'SAIDA', rotulo: 'Saída' },
  { valor: 'AJUSTE', rotulo: 'Ajuste' },
]

const TIPO = {
  ENTRADA: { rotulo: 'Entrada', classe: 'badge-success' },
  SAIDA: { rotulo: 'Saída', classe: 'badge-warning' },
  AJUSTE: { rotulo: 'Ajuste', classe: 'badge-info' },
}

const MOTIVO = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
  DESCARTE: 'Descarte',
  DEVOLUCAO: 'Devolução',
  ESTOQUE_INICIAL: 'Estoque inicial',
  AJUSTE_INVENTARIO: 'Ajuste de inventário',
}

const FILTROS_VAZIOS = { de: '', ate: '', produtoId: '', tipo: '', usuarioId: '', pagina: 1 }

const DATA_BR = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const HORA_BR = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function formatar(formatador, valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : formatador.format(data)
}

// O usuario escolhe o dia; o periodo vai fechado, do primeiro ao ultimo instante
// dele, senao o proprio dia final ficaria de fora. O instante e resolvido aqui,
// no fuso de quem esta na loja, e viaja em UTC — o fuso do servidor nao desloca
// a borda do dia.
function instante(dia, hora) {
  if (!dia) return undefined
  const data = new Date(`${dia}T${hora}`)
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString()
}

// O filtro por funcionario depende de GET /usuarios, restrito a gestor (RN10).
// Fica num componente proprio para que a consulta so exista quando ha permissao.
function FiltroFuncionario({ valor, aoMudar }) {
  const usuarios = useUsuarios('todos')

  return (
    <Campo id="movimentacoes-usuario" rotulo="Funcionário">
      <select
        id="movimentacoes-usuario"
        className="input-field"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
      >
        <option value="">Todos</option>
        {(usuarios.data ?? []).map((usuario) => (
          <option key={usuario.id} value={usuario.id}>
            {usuario.nome}
          </option>
        ))}
      </select>
    </Campo>
  )
}

export function Movimentacoes() {
  const menu = useMenuPrincipal()
  const { temPapel, autenticado } = useAuth()
  const podeFiltrarPorFuncionario = temPapel('GESTOR')
  const [searchParams] = useSearchParams()
  const [modal, setModal] = useState(null)

  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_VAZIOS,
    tipo: searchParams.get('tipo') ?? '',
  }))
  const [buscaProduto, setBuscaProduto] = useState('')

  // Trocar qualquer filtro volta pra pagina 1, senao a pagina atual pode nem
  // existir mais no resultado novo.
  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor, pagina: 1 }))
  }

  // Movimentacao de produto inativado continua no historico (CA11.6), entao o
  // filtro por produto tambem precisa enxergar os inativos.
  const consultaProdutos = useProdutos({
    busca: buscaProduto || undefined,
    ativo: 'todos',
    pagina: 1,
    porPagina: 50,
  })

  const consulta = useMovimentacoes({
    de: instante(filtros.de, '00:00:00.000'),
    ate: instante(filtros.ate, '23:59:59.999'),
    produtoId: filtros.produtoId || undefined,
    tipo: filtros.tipo || undefined,
    usuarioId: podeFiltrarPorFuncionario ? filtros.usuarioId || undefined : undefined,
    pagina: filtros.pagina,
  })
  const totaisEntrada = useMovimentacoes({
    de: instante(filtros.de, '00:00:00.000'),
    ate: instante(filtros.ate, '23:59:59.999'),
    produtoId: filtros.produtoId || undefined,
    tipo: 'ENTRADA',
    usuarioId: podeFiltrarPorFuncionario ? filtros.usuarioId || undefined : undefined,
    pagina: 1,
    porPagina: 1,
  })
  const totaisSaida = useMovimentacoes({
    de: instante(filtros.de, '00:00:00.000'),
    ate: instante(filtros.ate, '23:59:59.999'),
    produtoId: filtros.produtoId || undefined,
    tipo: 'SAIDA',
    usuarioId: podeFiltrarPorFuncionario ? filtros.usuarioId || undefined : undefined,
    pagina: 1,
    porPagina: 1,
  })

  const { dados: movimentacoes = [], meta } = consulta.data ?? {}
  const comFiltro = Object.entries(filtros).some(
    ([campo, valor]) => campo !== 'pagina' && valor !== '',
  )

  // RN03: o log e imutavel — nenhuma coluna de acao, nem editar nem excluir.
  const colunas = [
    { chave: 'quando', titulo: 'Quando', render: (m) => (
      <div>
        <p className="produto-nome">{formatar(DATA_BR, m.criadoEm)}</p>
        <p className="produto-meta">{formatar(HORA_BR, m.criadoEm)}</p>
      </div>
    ) },
    {
      chave: 'tipo',
      titulo: 'Tipo',
      render: (m) => (
        <span className={`badge ${TIPO[m.tipo]?.classe ?? 'badge-info'}`}>
          {TIPO[m.tipo]?.rotulo ?? m.tipo}
        </span>
      ),
    },
    { chave: 'motivo', titulo: 'Motivo', render: (m) => MOTIVO[m.motivo] ?? m.motivo },
    { chave: 'produto', titulo: 'Produto', render: (m) => (
      <div className="produto-celula">
        <ProdutoThumb id={m.produto?.id} nome={m.produto?.nome} categoria={m.produto?.categoria?.nome} />
        <div>
          <p className="produto-nome">{m.produto?.nome ?? '—'}</p>
          <p className="sku-codigo">{skuDoProduto({ id: m.produto?.id, categoria: m.produto?.categoria, nome: m.produto?.nome })}</p>
        </div>
      </div>
    ) },
    { chave: 'quantidade', titulo: 'Quantidade', alinhamento: 'right' },
    { chave: 'usuario', titulo: 'Responsável', render: (m) => m.usuario?.nome ?? '—' },
  ]

  return (
    <Layout
      titulo="Movimentações"
      subtitulo="Registro imutável de entradas, saídas e ajustes do dia a dia."
      menu={menu}
      buscaPlaceholder="Pesquisar por produto…"
      onBusca={(termo) => setBuscaProduto(termo)}
      acoes={
        autenticado ? (
          <>
            <button type="button" className="btn btn-accent" onClick={() => setModal({ tipo: 'ENTRADA' })}>
              Registrar entrada
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setModal({ tipo: 'SAIDA' })}>
              Registrar saída
            </button>
          </>
        ) : null
      }
    >
      <section className="kpi-grid kpi-grid-3" aria-label="Resumo do histórico">
        <KpiCard
          tom="mint"
          Icone={IconeMovimentacoes}
          rotulo="Entradas"
          valor={totaisEntrada.data?.meta?.total ?? 0}
          meta="Compras e estoque inicial"
        />
        <KpiCard
          tom="alerta"
          Icone={IconeAlerta}
          rotulo="Saídas"
          valor={totaisSaida.data?.meta?.total ?? 0}
          meta="Vendas, descarte e devolução"
        />
        <KpiCard
          tom="neutro"
          Icone={IconeProdutos}
          rotulo="Total filtrado"
          valor={meta?.total ?? 0}
          meta="Log imutável — sem editar ou excluir"
        />
      </section>

      <section className="filtros-bioma" aria-label="Filtros do histórico">
        <div className="filtros-bioma-topo">
          <div>
            <h2 className="text-h3">Filtros</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Período, produto e tipo da movimentação.
            </p>
          </div>
          <div className="segmented" role="tablist" aria-label="Tipo" id="movimentacoes-tipo">
            {TIPOS.map((opcao) => (
              <button
                key={opcao.valor || 'todos'}
                type="button"
                role="tab"
                aria-selected={filtros.tipo === opcao.valor}
                className={`segmented-btn${filtros.tipo === opcao.valor ? ' segmented-btn-ativo' : ''}`}
                onClick={() => mudarFiltro('tipo', opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="filtros-bioma-campos">
        <Campo
          id="movimentacoes-de"
          rotulo="De"
          type="date"
          value={filtros.de}
          max={filtros.ate || undefined}
          onChange={(evento) => mudarFiltro('de', evento.target.value)}
        />

        <Campo
          id="movimentacoes-ate"
          rotulo="Até"
          type="date"
          value={filtros.ate}
          min={filtros.de || undefined}
          onChange={(evento) => mudarFiltro('ate', evento.target.value)}
        />

        <Campo
          id="movimentacoes-busca"
          rotulo="Buscar produto"
          type="search"
          placeholder="Nome do produto"
          value={buscaProduto}
          onChange={(evento) => setBuscaProduto(evento.target.value)}
        />

        <Campo id="movimentacoes-produto" rotulo="Produto">
          <select
            id="movimentacoes-produto"
            className="input-field"
            value={filtros.produtoId}
            onChange={(evento) => mudarFiltro('produtoId', evento.target.value)}
          >
            <option value="">Todos</option>
            {(consultaProdutos.data?.dados ?? []).map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </Campo>

        {podeFiltrarPorFuncionario && (
          <FiltroFuncionario
            valor={filtros.usuarioId}
            aoMudar={(valor) => mudarFiltro('usuarioId', valor)}
          />
        )}

        {comFiltro && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFiltros(FILTROS_VAZIOS)
              setBuscaProduto('')
            }}
          >
            Limpar filtros
          </button>
        )}
        </div>
      </section>

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      <section className="painel">
      <Tabela
        colunas={colunas}
        dados={movimentacoes}
        carregando={consulta.isPending}
        vazio={
          <EstadoVazio
            titulo="Nenhuma movimentação encontrada"
            descricao={
              comFiltro
                ? 'Ajuste o período ou os filtros para ver outras movimentações.'
                : 'As entradas e saídas registradas aparecem aqui, da mais recente para a mais antiga.'
            }
          />
        }
      />

      {meta && (
        <Paginacao
          pagina={meta.pagina}
          totalPaginas={meta.totalPaginas}
          total={meta.total}
          aoMudar={(pagina) => setFiltros((atual) => ({ ...atual, pagina }))}
        />
      )}
      </section>

      {modal && (
        <ModalMovimentacao
          aberto
          tipo={modal.tipo}
          produtoInicial={modal.produto ?? null}
          aoFechar={() => setModal(null)}
        />
      )}
    </Layout>
  )
}
