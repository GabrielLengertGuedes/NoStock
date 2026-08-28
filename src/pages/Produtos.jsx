import { useState } from 'react'

import { useCategorias } from '../api/categorias.js'
import { useProdutos } from '../api/produtos.js'
import { BadgeStatus } from '../components/BadgeStatus.jsx'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { Paginacao } from '../components/Paginacao.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'SEM_ESTOQUE', rotulo: 'Sem estoque' },
  { valor: 'CRITICO', rotulo: 'Crítico' },
  { valor: 'BAIXO', rotulo: 'Baixo' },
  { valor: 'NORMAL', rotulo: 'Normal' },
  { valor: 'PRECISA_REPOR', rotulo: 'Precisa repor' },
]

const FILTROS_VAZIOS = { busca: '', categoriaId: '', status: '', pagina: 1 }

export function Produtos() {
  const menu = useMenuPrincipal()
  const categorias = useCategorias()
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)

  // Trocar qualquer filtro volta pra pagina 1, senao a pagina atual pode nem
  // existir mais no resultado novo.
  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor, pagina: 1 }))
  }

  const consulta = useProdutos({
    busca: filtros.busca || undefined,
    categoriaId: filtros.categoriaId || undefined,
    status: filtros.status || undefined,
    pagina: filtros.pagina,
  })
  const { dados: produtos = [], meta } = consulta.data ?? {}

  const colunas = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'categoria', titulo: 'Categoria', render: (p) => p.categoria.nome },
    { chave: 'quantidadeAtual', titulo: 'Saldo', alinhamento: 'right' },
    { chave: 'estoqueMinimo', titulo: 'Mínimo', alinhamento: 'right' },
    {
      chave: 'statusEstoque',
      titulo: 'Status',
      render: (p) => <BadgeStatus status={p.statusEstoque} />,
    },
  ]

  return (
    <Layout titulo="Produtos" menu={menu}>
      <div
        className="flex gap-md"
        style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--spacing-base)' }}
      >
        <Campo
          id="produtos-busca"
          rotulo="Buscar"
          type="search"
          placeholder="Nome do produto"
          value={filtros.busca}
          onChange={(e) => mudarFiltro('busca', e.target.value)}
        />

        <Campo id="produtos-categoria" rotulo="Categoria">
          <select
            id="produtos-categoria"
            className="input-field"
            value={filtros.categoriaId}
            onChange={(e) => mudarFiltro('categoriaId', e.target.value)}
          >
            <option value="">Todas</option>
            {(categorias.data ?? []).map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="produtos-status" rotulo="Status do estoque">
          <select
            id="produtos-status"
            className="input-field"
            value={filtros.status}
            onChange={(e) => mudarFiltro('status', e.target.value)}
          >
            {STATUS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      <Tabela
        colunas={colunas}
        dados={produtos}
        carregando={consulta.isPending}
        vazio={
          <EstadoVazio
            titulo="Nenhum produto encontrado"
            descricao="Ajuste a busca ou os filtros para ver outros produtos do catálogo."
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
    </Layout>
  )
}
