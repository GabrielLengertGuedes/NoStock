import { useState } from 'react'

import { useMovimentacoes } from '../api/movimentacoes.js'
import { useProdutos } from '../api/produtos.js'
import { useUsuarios } from '../api/usuarios.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { Paginacao } from '../components/Paginacao.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

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
  const { temPapel } = useAuth()
  const podeFiltrarPorFuncionario = temPapel('GESTOR')

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
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

  const { dados: movimentacoes = [], meta } = consulta.data ?? {}
  const comFiltro = Object.entries(filtros).some(
    ([campo, valor]) => campo !== 'pagina' && valor !== '',
  )

  // RN03: o log e imutavel — nenhuma coluna de acao, nem editar nem excluir.
  const colunas = [
    { chave: 'data', titulo: 'Data', render: (m) => formatar(DATA_BR, m.criadoEm) },
    { chave: 'hora', titulo: 'Hora', render: (m) => formatar(HORA_BR, m.criadoEm) },
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
    { chave: 'produto', titulo: 'Produto', render: (m) => m.produto?.nome ?? '—' },
    { chave: 'quantidade', titulo: 'Quantidade', alinhamento: 'right' },
    { chave: 'usuario', titulo: 'Responsável', render: (m) => m.usuario?.nome ?? '—' },
  ]

  return (
    <Layout titulo="Movimentações" menu={menu}>
      <div
        className="flex gap-md"
        style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--spacing-base)' }}
      >
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

        <Campo id="movimentacoes-tipo" rotulo="Tipo">
          <select
            id="movimentacoes-tipo"
            className="input-field"
            value={filtros.tipo}
            onChange={(evento) => mudarFiltro('tipo', evento.target.value)}
          >
            {TIPOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
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

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

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
    </Layout>
  )
}
