import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useCategorias } from '../api/categorias.js'
import { useInativarProduto, useProdutos, useReativarProduto, useResumoProdutos } from '../api/produtos.js'
import { BadgeStatus } from '../components/BadgeStatus.jsx'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { FabBioma } from '../components/FabBioma.jsx'
import { IconeAlerta, IconeProdutos } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { MenuAcoes } from '../components/MenuAcoes.jsx'
import { Modal } from '../components/Modal.jsx'
import { ModalMovimentacao } from '../components/ModalMovimentacao.jsx'
import { Paginacao } from '../components/Paginacao.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAoPararDeDigitar } from '../hooks/useAoPararDeDigitar.js'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { useToast } from '../hooks/useToast.js'
import { MOEDA } from '../lib/formatos.js'
import { skuDoProduto } from '../lib/sku.js'

const FILTROS_VAZIOS = { busca: '', categoriaId: '', status: '', ativo: 'true', pagina: 1 }

// Os filtros nascem da URL (?busca= vinda da busca do topo, ?status= do sino de
// alertas). A key faz cada navegacao para /produtos recomecar por ela: sem isso,
// clicar no sino ja estando aqui nao mudava nada, porque o estado so lia a URL
// na primeira montagem.
export function Produtos() {
  const { key } = useLocation()
  return <ListaDeProdutos key={key} />
}

function ListaDeProdutos() {
  const menu = useMenuPrincipal()
  const navegar = useNavigate()
  const [searchParams] = useSearchParams()
  const { autenticado, temPapel } = useAuth()
  const podeEditar = autenticado
  const podeExcluir = temPapel('GESTOR')
  const categorias = useCategorias()
  const inativar = useInativarProduto()
  const reativar = useReativarProduto()
  const toast = useToast()

  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_VAZIOS,
    busca: searchParams.get('busca')?.trim() ?? '',
    status: searchParams.get('status') ?? '',
  }))
  const [textoBusca, setTextoBusca] = useState(filtros.busca)
  const [aExcluir, setAExcluir] = useState(null)
  const [movimentacao, setMovimentacao] = useState(null)

  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor, pagina: 1 }))
  }

  const buscaAdiada = useAoPararDeDigitar((texto) => mudarFiltro('busca', texto.trim()))

  function mudarBusca(texto) {
    setTextoBusca(texto)
    buscaAdiada.agendar(texto)
  }

  function abrirExclusao(produto) {
    // Sem o reset, o erro da ultima exclusao aparecia no modal do proximo produto.
    inativar.reset()
    setAExcluir(produto)
  }

  function confirmarExclusao() {
    inativar.mutateAsync(aExcluir.id).then(() => setAExcluir(null)).catch(() => {})
  }

  function reativarProduto(produto) {
    reativar
      .mutateAsync(produto.id)
      .then(() => toast.mostrar({ titulo: 'Produto reativado', mensagem: produto.nome }))
      .catch((erro) =>
        toast.mostrar({ tipo: 'erro', titulo: 'Não foi possível reativar', mensagem: erro.mensagem }),
      )
  }

  const vendoInativos = filtros.ativo === 'false'

  const consulta = useProdutos({
    busca: filtros.busca || undefined,
    categoriaId: filtros.categoriaId || undefined,
    status: filtros.status || undefined,
    ativo: filtros.ativo,
    pagina: filtros.pagina,
  })
  const { dados: produtos = [], meta } = consulta.data ?? {}

  const resumo = useResumoProdutos()

  const abas = [
    { valor: '', rotulo: 'Todos' },
    { valor: 'CRITICO', rotulo: 'Críticos' },
    { valor: 'PRECISA_REPOR', rotulo: 'Atenção' },
    { valor: 'NORMAL', rotulo: 'Em dia' },
    { valor: 'SEM_ESTOQUE', rotulo: 'Sem estoque' },
  ]

  const colunas = [
    {
      chave: 'nome',
      titulo: 'Produto',
      render: (p) => (
        <div className="produto-celula">
          <ProdutoThumb id={p.id} nome={p.nome} categoria={p.categoria?.nome} />
          <div>
            <p className="produto-nome">{p.nome}</p>
            <p className="sku-codigo">{skuDoProduto(p)}</p>
          </div>
        </div>
      ),
    },
    {
      chave: 'categoria',
      titulo: 'Categoria',
      render: (p) => <span className="categoria-pill">{p.categoria?.nome ?? '—'}</span>,
    },
    {
      chave: 'precoVenda',
      titulo: 'Preço',
      render: (p) => <span className="text-mono">{p.precoVenda != null ? MOEDA.format(p.precoVenda) : '—'}</span>,
    },
    {
      chave: 'quantidadeAtual',
      titulo: 'Quantidade',
      render: (p) => (
        <div className={`qtd-celula${p.quantidadeAtual <= (p.estoqueMinimo ?? 0) ? ' qtd-baixa' : ''}`}>
          <strong>{p.quantidadeAtual} un.</strong>
          <span>Mínimo: {p.estoqueMinimo ?? 0} un.</span>
        </div>
      ),
    },
    {
      chave: 'statusEstoque',
      titulo: 'Status',
      render: (p) => <BadgeStatus status={p.statusEstoque} />,
    },
  ]

  if (podeEditar) {
    colunas.push({
      chave: 'acoes',
      titulo: '',
      alinhamento: 'right',
      render: (produto) => {
        // Produto inativo nao recebe movimentacao: a unica acao e trazer de volta.
        if (!produto.ativo) {
          return podeExcluir ? (
            <MenuAcoes
              rotulo={`Ações de ${produto.nome}`}
              itens={[{ rotulo: 'Reativar', onClick: () => reativarProduto(produto) }]}
            />
          ) : null
        }

        const itens = [
          { rotulo: 'Registrar entrada', onClick: () => setMovimentacao({ tipo: 'ENTRADA', produto }) },
          { rotulo: 'Registrar saída', onClick: () => setMovimentacao({ tipo: 'SAIDA', produto }) },
          { rotulo: 'Editar', onClick: () => navegar(`/produtos/${produto.id}/editar`) },
        ]
        if (podeExcluir) {
          itens.push({ rotulo: 'Excluir', onClick: () => abrirExclusao(produto), perigo: true })
        }
        return <MenuAcoes rotulo={`Ações de ${produto.nome}`} itens={itens} />
      },
    })
  }

  return (
    <Layout
      titulo="Estoque de Produtos"
      subtitulo="Gerencie o inventário em tempo real e acompanhe a disponibilidade."
      menu={menu}
      buscaPlaceholder="Buscar produtos pelo nome…"
      busca={textoBusca}
      aoMudarBusca={mudarBusca}
      acoes={
        podeEditar ? (
          <Link to="/produtos/novo" className="btn btn-primary">
            + Novo produto
          </Link>
        ) : null
      }
    >
      <div className="filtros-linha">
        <div className="segmented" role="tablist" aria-label="Filtro rápido de status">
          {abas.map((aba) => (
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

        <Campo id="produtos-categoria" rotulo="Categoria">
          <select
            id="produtos-categoria"
            className="input-field"
            value={filtros.categoriaId}
            onChange={(e) => mudarFiltro('categoriaId', e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {(categorias.data ?? []).map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </Campo>

        {podeExcluir && (
          <Campo id="produtos-situacao" rotulo="Situação">
            <select
              id="produtos-situacao"
              className="input-field"
              value={filtros.ativo}
              onChange={(e) => mudarFiltro('ativo', e.target.value)}
            >
              <option value="true">Ativos</option>
              <option value="false">Excluídos</option>
            </select>
          </Campo>
        )}
      </div>

      <section className="kpi-grid kpi-grid-3" aria-label="Indicadores de produtos">
        <KpiCard
          tom="neutro"
          Icone={IconeProdutos}
          rotulo="Total de SKUs"
          valor={resumo.data?.totalProdutos ?? '—'}
          meta={<span className="kpi-pill kpi-pill-ok">Catálogo ativo</span>}
        />
        <KpiCard
          tom="urgente"
          Icone={IconeAlerta}
          rotulo="Precisam de reposição"
          valor={resumo.data?.precisamRepor ?? '—'}
          meta={<span className="kpi-pill kpi-pill-danger">Ação requerida</span>}
        />
        <KpiCard
          tom="mint"
          Icone={IconeProdutos}
          rotulo="Valor de inventário"
          valor={resumo.data ? MOEDA.format(resumo.data.valorInventario) : '—'}
          valorPequeno
          meta={<span className="kpi-pill kpi-pill-ok">Preço de venda × saldo</span>}
        />
      </section>

      <section className="painel">
        <Tabela
          colunas={colunas}
          dados={produtos}
          carregando={consulta.isPending}
          erro={consulta.error}
          vazio={
            <EstadoVazio
              titulo={vendoInativos ? 'Nenhum produto excluído' : 'Nenhum produto encontrado'}
              descricao="Ajuste a busca ou os filtros para ver outros produtos do catálogo."
              acao={
                podeEditar && !vendoInativos ? (
                  <Link to="/produtos/novo" className="btn btn-primary">
                    Cadastrar o primeiro
                  </Link>
                ) : null
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

      {podeEditar && <FabBioma onClick={() => setMovimentacao({ tipo: 'ENTRADA' })} />}

      {movimentacao && (
        <ModalMovimentacao
          aberto
          tipo={movimentacao.tipo}
          produtoInicial={movimentacao.produto}
          aoFechar={() => setMovimentacao(null)}
        />
      )}

      <Modal
        aberto={aExcluir !== null}
        aoFechar={() => setAExcluir(null)}
        titulo="Excluir produto"
        subtitulo="Exclusão lógica: o histórico de movimentações permanece."
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAExcluir(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmarExclusao}
              disabled={inativar.isPending}
            >
              {inativar.isPending ? 'Excluindo…' : 'Excluir'}
            </button>
          </>
        }
      >
        <p className="text-body">
          Confirma a exclusão do produto <strong>{aExcluir?.nome}</strong>? O saldo atual é{' '}
          <strong>{aExcluir?.quantidadeAtual ?? 0}</strong> unidade(s).
        </p>
        {inativar.error && (
          <p className="campo-erro text-body-sm" role="alert">
            {inativar.error.mensagem}
          </p>
        )}
      </Modal>
    </Layout>
  )
}
