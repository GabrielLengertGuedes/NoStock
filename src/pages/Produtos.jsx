import { useState } from 'react'

import { useCategorias } from '../api/categorias.js'
import { useFornecedores } from '../api/fornecedores.js'
import {
  useAtualizarProduto,
  useCriarProduto,
  useInativarProduto,
  useProdutos,
} from '../api/produtos.js'
import { BadgeStatus } from '../components/BadgeStatus.jsx'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { Modal } from '../components/Modal.jsx'
import { ModalMovimentacao } from '../components/ModalMovimentacao.jsx'
import { Paginacao } from '../components/Paginacao.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAuth } from '../hooks/useAuth.js'
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
const FORM_VAZIO = {
  nome: '',
  descricao: '',
  categoriaId: '',
  fornecedorId: '',
  precoVenda: '',
  estoqueInicial: '',
  estoqueMinimo: '0',
}

export function Produtos() {
  const menu = useMenuPrincipal()
  const { autenticado, temPapel } = useAuth()
  const podeEditar = autenticado
  const podeExcluir = temPapel('GESTOR')
  const categorias = useCategorias()
  const fornecedores = useFornecedores()
  const criar = useCriarProduto()
  const atualizar = useAtualizarProduto()
  const inativar = useInativarProduto()

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [emEdicao, setEmEdicao] = useState(null)
  const [aExcluir, setAExcluir] = useState(null)
  const [movimentacao, setMovimentacao] = useState(null)
  const [formulario, setFormulario] = useState(FORM_VAZIO)
  const [confirmarDuplicado, setConfirmarDuplicado] = useState(false)

  // Trocar qualquer filtro volta pra pagina 1, senao a pagina atual pode nem
  // existir mais no resultado novo.
  function mudarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor, pagina: 1 }))
  }

  function abrirFormulario(produto) {
    criar.reset()
    atualizar.reset()
    setConfirmarDuplicado(false)
    setEmEdicao(produto ?? { id: null })
    setFormulario(
      produto
        ? {
            nome: produto.nome ?? '',
            descricao: produto.descricao ?? '',
            categoriaId: produto.categoria?.id ?? '',
            fornecedorId: produto.fornecedor?.id ?? '',
            precoVenda: produto.precoVenda ?? '',
            estoqueInicial: '',
            estoqueMinimo: produto.estoqueMinimo ?? '0',
          }
        : FORM_VAZIO,
    )
  }

  function montarDados() {
    const categoriaId = formulario.categoriaId === '' ? null : Number(formulario.categoriaId)
    const precoVenda = formulario.precoVenda === '' ? null : Number(formulario.precoVenda)
    const estoqueMinimo = formulario.estoqueMinimo === '' ? 0 : Number(formulario.estoqueMinimo)
    const estoqueInicial = formulario.estoqueInicial === '' ? 0 : Number(formulario.estoqueInicial)

    return {
      nome: formulario.nome,
      descricao: formulario.descricao || null,
      categoriaId,
      fornecedorId: formulario.fornecedorId ? Number(formulario.fornecedorId) : null,
      precoVenda,
      estoqueMinimo,
      ...(emEdicao?.id ? {} : { estoqueInicial }),
      confirmarNomeDuplicado: confirmarDuplicado,
    }
  }

  function fecharFormulario() {
    setEmEdicao(null)
    setConfirmarDuplicado(false)
    setFormulario(FORM_VAZIO)
  }

  function salvar(evento) {
    evento.preventDefault()

    const dados = montarDados()
    const acao = emEdicao?.id
      ? atualizar.mutateAsync({ id: emEdicao.id, ...dados })
      : criar.mutateAsync(dados)

    acao
      .then(() => fecharFormulario())
      .catch((erro) => {
        if (erro?.codigo === 'NOME_DUPLICADO' && !confirmarDuplicado) {
          setConfirmarDuplicado(true)
        }
      })
  }

  function salvarMesmoAssim() {
    const dados = { ...montarDados(), confirmarNomeDuplicado: true }
    const acao = emEdicao?.id
      ? atualizar.mutateAsync({ id: emEdicao.id, ...dados })
      : criar.mutateAsync(dados)

    acao
      .then(() => fecharFormulario())
      .catch((erro) => {
        if (erro?.codigo === 'NOME_DUPLICADO') {
          setConfirmarDuplicado(true)
        }
      })
  }

  function confirmarExclusao() {
    inativar.mutateAsync(aExcluir.id).then(() => setAExcluir(null)).catch(() => {})
  }

  const consulta = useProdutos({
    busca: filtros.busca || undefined,
    categoriaId: filtros.categoriaId || undefined,
    status: filtros.status || undefined,
    pagina: filtros.pagina,
  })
  const { dados: produtos = [], meta } = consulta.data ?? {}
  const salvando = criar.isPending || atualizar.isPending
  const erroDoServidor = criar.error ?? atualizar.error
  const criando = emEdicao !== null && !emEdicao.id

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

  if (podeEditar) {
    colunas.push({
      chave: 'acoes',
      titulo: 'Ações',
      alinhamento: 'right',
      render: (produto) => (
        <div className="flex gap-sm" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setMovimentacao({ tipo: 'ENTRADA', produto })}
          >
            Entrada
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setMovimentacao({ tipo: 'SAIDA', produto })}
          >
            Saída
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => abrirFormulario(produto)}>
            Editar
          </button>
          {podeExcluir && (
            <button type="button" className="btn btn-danger" onClick={() => setAExcluir(produto)}>
              Excluir
            </button>
          )}
        </div>
      ),
    })
  }

  return (
    <Layout
      titulo="Produtos"
      menu={menu}
      acoes={
        podeEditar ? (
          <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
            Novo produto
          </button>
        ) : null
      }
    >
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
            acao={
              podeEditar ? (
                <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                  Cadastrar o primeiro
                </button>
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

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar produto' : 'Novo produto'}
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={fecharFormulario}>
              Cancelar
            </button>
            {confirmarDuplicado && (
              <button type="button" className="btn btn-primary" onClick={salvarMesmoAssim} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar mesmo assim'}
              </button>
            )}
            {!confirmarDuplicado && (
              <button type="submit" form="formulario-produto" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            )}
          </>
        }
      >
        <form id="formulario-produto" onSubmit={salvar} className="modal-corpo">
          <Campo
            id="produto-nome"
            rotulo="Nome"
            obrigatorio
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            erro={erroDoServidor?.campos?.nome}
          />
          <Campo
            id="produto-descricao"
            rotulo="Descrição"
            ajuda="Opcional."
            value={formulario.descricao}
            onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
            erro={erroDoServidor?.campos?.descricao}
          />
          <Campo id="produto-categoriaId" rotulo="Categoria" obrigatorio erro={erroDoServidor?.campos?.categoriaId}>
            <select
              id="produto-categoriaId"
              className="input-field"
              value={formulario.categoriaId}
              onChange={(e) => setFormulario({ ...formulario, categoriaId: e.target.value })}
              aria-invalid={erroDoServidor?.campos?.categoriaId ? 'true' : undefined}
              required
            >
              <option value="">Selecione uma categoria</option>
              {(categorias.data ?? []).map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="produto-fornecedorId" rotulo="Fornecedor" ajuda="Opcional." erro={erroDoServidor?.campos?.fornecedorId}>
            <select
              id="produto-fornecedorId"
              className="input-field"
              value={formulario.fornecedorId}
              onChange={(e) => setFormulario({ ...formulario, fornecedorId: e.target.value })}
              aria-invalid={erroDoServidor?.campos?.fornecedorId ? 'true' : undefined}
            >
              <option value="">Sem fornecedor</option>
              {(fornecedores.data ?? []).map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            id="produto-precoVenda"
            rotulo="Preço de venda"
            type="number"
            min="0"
            step="0.01"
            obrigatorio
            value={formulario.precoVenda}
            onChange={(e) => setFormulario({ ...formulario, precoVenda: e.target.value })}
            erro={erroDoServidor?.campos?.precoVenda}
          />
          {criando && (
            <Campo
              id="produto-estoqueInicial"
              rotulo="Estoque inicial"
              type="number"
              min="0"
              step="1"
              value={formulario.estoqueInicial}
              onChange={(e) => setFormulario({ ...formulario, estoqueInicial: e.target.value })}
              erro={erroDoServidor?.campos?.estoqueInicial}
            />
          )}
          <Campo
            id="produto-estoqueMinimo"
            rotulo="Estoque mínimo"
            type="number"
            min="0"
            step="1"
            obrigatorio
            value={formulario.estoqueMinimo}
            onChange={(e) => setFormulario({ ...formulario, estoqueMinimo: e.target.value })}
            erro={erroDoServidor?.campos?.estoqueMinimo}
          />
          {erroDoServidor && !erroDoServidor.campos && (
            <p className="campo-erro text-body-sm" role="alert">
              {erroDoServidor.mensagem}
            </p>
          )}
          {erroDoServidor?.codigo === 'NOME_DUPLICADO' && !confirmarDuplicado && (
            <p className="campo-erro text-body-sm" role="alert">
              Já existe um produto ativo com esse nome. Confirme para salvar mesmo assim.
            </p>
          )}
        </form>
      </Modal>

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
