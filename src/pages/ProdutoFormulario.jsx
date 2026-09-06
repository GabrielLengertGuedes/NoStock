import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useCategorias } from '../api/categorias.js'
import { useFornecedores } from '../api/fornecedores.js'
import {
  useAtualizarProduto,
  useCriarProduto,
  useProduto,
} from '../api/produtos.js'
import { Campo } from '../components/Campo.jsx'
import { IconeImagem } from '../components/IconesBioma.jsx'
import { Layout } from '../components/Layout.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { skuDoProduto } from '../lib/sku.js'
import { apagarMidiaLocal, gravarMidiaLocal, lerMidiaLocal, promoverMidiaNovo } from '../lib/midiaLocal.js'

const FORM_VAZIO = {
  nome: '',
  descricao: '',
  categoriaId: '',
  fornecedorId: '',
  precoVenda: '',
  estoqueInicial: '',
  estoqueMinimo: '0',
}

function camposDoProduto(produto) {
  return {
    nome: produto.nome ?? '',
    descricao: produto.descricao ?? '',
    categoriaId: produto.categoria?.id ?? '',
    fornecedorId: produto.fornecedor?.id ?? '',
    precoVenda: produto.precoVenda ?? '',
    estoqueInicial: '',
    estoqueMinimo: String(produto.estoqueMinimo ?? 0),
  }
}

export function ProdutoFormulario() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navegar = useNavigate()
  const menu = useMenuPrincipal()
  const { autenticado } = useAuth()
  const categorias = useCategorias()
  const fornecedores = useFornecedores()
  const produtoConsulta = useProduto(editando ? id : null)
  const criar = useCriarProduto()
  const atualizar = useAtualizarProduto()
  const produto = produtoConsulta.data
  const idMidia = editando ? id : 'novo'

  const [formulario, setFormulario] = useState(FORM_VAZIO)
  const [rascunhoDe, setRascunhoDe] = useState(null)
  const [confirmarDuplicado, setConfirmarDuplicado] = useState(false)
  const [midiaUrl, setMidiaUrl] = useState(() => lerMidiaLocal(idMidia))
  const [midiaDe, setMidiaDe] = useState(idMidia)

  if (midiaDe !== idMidia) {
    setMidiaDe(idMidia)
    setMidiaUrl(lerMidiaLocal(idMidia))
  }

  if (!editando && rascunhoDe !== 'novo') {
    setRascunhoDe('novo')
    setFormulario(FORM_VAZIO)
  }

  if (editando && produto && rascunhoDe !== produto.id) {
    setRascunhoDe(produto.id)
    setFormulario(camposDoProduto(produto))
  }

  if (!autenticado) return null

  const salvando = criar.isPending || atualizar.isPending
  const erroDoServidor = criar.error ?? atualizar.error
  const categoriaNome =
    (categorias.data ?? []).find((c) => String(c.id) === String(formulario.categoriaId))?.nome ??
    produto?.categoria?.nome ??
    ''

  function montarDados(forcarDuplicado = false) {
    return {
      nome: formulario.nome,
      descricao: formulario.descricao || null,
      categoriaId: formulario.categoriaId === '' ? null : Number(formulario.categoriaId),
      fornecedorId: formulario.fornecedorId ? Number(formulario.fornecedorId) : null,
      precoVenda: formulario.precoVenda === '' ? null : Number(formulario.precoVenda),
      estoqueMinimo: formulario.estoqueMinimo === '' ? 0 : Number(formulario.estoqueMinimo),
      ...(editando ? {} : { estoqueInicial: formulario.estoqueInicial === '' ? 0 : Number(formulario.estoqueInicial) }),
      confirmarNomeDuplicado: forcarDuplicado || confirmarDuplicado,
    }
  }

  function aoSucesso(produto) {
    if (!editando && produto?.id) promoverMidiaNovo(produto.id)
    navegar('/produtos', { replace: true })
  }

  function salvar(evento) {
    evento.preventDefault()
    const dados = montarDados(false)
    const acao = editando
      ? atualizar.mutateAsync({ id: Number(id), ...dados })
      : criar.mutateAsync(dados)

    acao
      .then(aoSucesso)
      .catch((erro) => {
        if (erro?.codigo === 'NOME_DUPLICADO') setConfirmarDuplicado(true)
      })
  }

  function salvarMesmoAssim() {
    const dados = montarDados(true)
    const acao = editando
      ? atualizar.mutateAsync({ id: Number(id), ...dados })
      : criar.mutateAsync(dados)

    acao.then(aoSucesso).catch(() => setConfirmarDuplicado(true))
  }

  function aoEscolherMidia(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo || !arquivo.type.startsWith('image/')) return
    const leitor = new FileReader()
    leitor.onload = () => {
      const dataUrl = String(leitor.result ?? '')
      setMidiaUrl(dataUrl)
      gravarMidiaLocal(idMidia, dataUrl)
    }
    leitor.readAsDataURL(arquivo)
  }

  function removerMidia() {
    setMidiaUrl(null)
    apagarMidiaLocal(idMidia)
  }

  const sku = skuDoProduto({
    id: editando ? id : null,
    categoria: categoriaNome,
    nome: formulario.nome,
  })

  if (editando && produtoConsulta.isPending) {
    return (
      <Layout titulo="Editar produto" menu={menu}>
        <p className="text-body" style={{ color: 'var(--gray)' }}>
          Carregando produto…
        </p>
      </Layout>
    )
  }

  if (editando && produtoConsulta.isError) {
    return (
      <Layout titulo="Editar produto" menu={menu}>
        <p className="campo-erro text-body" role="alert">
          {produtoConsulta.error?.mensagem ?? 'Produto não encontrado.'}
        </p>
        <Link to="/produtos" className="btn btn-secondary">
          Voltar à lista
        </Link>
      </Layout>
    )
  }

  return (
    <Layout
      titulo={editando ? 'Editar produto' : 'Novo produto'}
      subtitulo={
        editando
          ? 'Atualize o cadastro. O saldo só muda por movimentação.'
          : 'Cadastre um item do inventário com preço, mínimo e estoque inicial.'
      }
      menu={menu}
    >
      <nav className="produto-form-breadcrumb text-body-sm" aria-label="Navegação">
        <Link to="/produtos">Produtos</Link>
        <span aria-hidden="true">/</span>
        <span>{editando ? 'Editar' : 'Novo'}</span>
      </nav>

      <div className="produto-form-grid">
        <section className="painel produto-form-painel">
          <div className="painel-cabecalho">
            <div>
              <h2 className="text-h3">Dados do produto</h2>
              <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
                Informações usadas no estoque, alertas e movimentações.
              </p>
            </div>
          </div>

          <form id="formulario-produto-pagina" onSubmit={salvar} className="produto-form-campos">
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
              erro={erroDoServidor?.campos?.descricao}
            >
              <textarea
                id="produto-descricao"
                className="input-field"
                rows={3}
                value={formulario.descricao}
                onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
              />
            </Campo>

            <div className="produto-form-duas-colunas">
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
              <Campo
                id="produto-fornecedorId"
                rotulo="Fornecedor"
                ajuda="Opcional."
                erro={erroDoServidor?.campos?.fornecedorId}
              >
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
            </div>

            <div className="produto-form-duas-colunas">
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
            </div>

            {editando && (
              <Campo id="produto-sku" rotulo="SKU" ajuda="Gerado automaticamente.">
                <input
                  id="produto-sku"
                  className="input-field"
                  value={sku}
                  readOnly
                  disabled
                />
              </Campo>
            )}

            {!editando && (
              <Campo
                id="produto-estoqueInicial"
                rotulo="Estoque inicial"
                type="number"
                min="0"
                step="1"
                ajuda="Gera movimentação de estoque inicial ao salvar."
                value={formulario.estoqueInicial}
                onChange={(e) => setFormulario({ ...formulario, estoqueInicial: e.target.value })}
                erro={erroDoServidor?.campos?.estoqueInicial}
              />
            )}

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

            <div className="produto-form-acoes">
              <Link to="/produtos" className="btn btn-secondary">
                Cancelar
              </Link>
              {confirmarDuplicado && (
                <button type="button" className="btn btn-primary" onClick={salvarMesmoAssim} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar mesmo assim'}
                </button>
              )}
              {!confirmarDuplicado && (
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar produto'}
                </button>
              )}
            </div>
          </form>
        </section>

        <aside className="painel produto-form-preview">
          <div className="painel-cabecalho">
            <div>
              <h2 className="text-h3">Pré-visualização</h2>
              <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
                Como o item aparece nas listagens.
              </p>
            </div>
          </div>

          <div className="produto-form-preview-card">
            <ProdutoThumb
              id={editando ? id : 'novo'}
              nome={formulario.nome || 'P'}
              categoria={categoriaNome}
              foto={midiaUrl}
            />
            <div>
              <p className="produto-nome">{formulario.nome || 'Nome do produto'}</p>
              <p className="produto-meta">
                {categoriaNome || 'Sem categoria'}
                {` · ${sku}`}
              </p>
            </div>
          </div>

          <div className="produto-form-midia">
            {midiaUrl ? (
              <>
                <img className="produto-form-midia-preview" src={midiaUrl} alt={`Prévia de ${formulario.nome || 'produto'}`} />
                <div className="produto-form-midia-acoes">
                  <label className="btn btn-secondary">
                    Trocar imagem
                    <input type="file" accept="image/*" onChange={aoEscolherMidia} />
                  </label>
                  <button type="button" className="btn btn-secondary" onClick={removerMidia}>
                    Remover
                  </button>
                </div>
              </>
            ) : (
              <label className="produto-form-midia-placeholder">
                <IconeImagem size={32} />
                <p>Mídia do produto</p>
                <span>Clique para escolher uma imagem. Fica só neste navegador até existir upload no servidor.</span>
                <input type="file" accept="image/*" onChange={aoEscolherMidia} />
              </label>
            )}
          </div>

          {editando && produto && (
            <dl className="produto-form-meta">
              <div>
                <dt>Saldo atual</dt>
                <dd>{produto.quantidadeAtual} un.</dd>
              </div>
              <div>
                <dt>Mínimo</dt>
                <dd>{produto.estoqueMinimo} un.</dd>
              </div>
            </dl>
          )}
        </aside>
      </div>
    </Layout>
  )
}
