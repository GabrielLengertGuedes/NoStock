import { useState } from 'react'

import {
  useAtualizarCategoria,
  useCategorias,
  useCriarCategoria,
  useInativarCategoria,
} from '../api/categorias.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { IconeCategorias, IconeProdutos } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { MenuAcoes } from '../components/MenuAcoes.jsx'
import { Modal } from '../components/Modal.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const VAZIA = { nome: '', descricao: '' }

export function Categorias() {
  const { temPapel } = useAuth()
  const podeEditar = temPapel('GESTOR')
  const menu = useMenuPrincipal()
  const consulta = useCategorias()
  const criar = useCriarCategoria()
  const atualizar = useAtualizarCategoria()
  const inativar = useInativarCategoria()

  const [emEdicao, setEmEdicao] = useState(null)
  const [aInativar, setAInativar] = useState(null)
  const [formulario, setFormulario] = useState(VAZIA)

  const salvando = criar.isPending || atualizar.isPending
  const erroDoServidor = criar.error ?? atualizar.error

  function abrirFormulario(categoria) {
    criar.reset()
    atualizar.reset()
    setEmEdicao(categoria ?? VAZIA)
    setFormulario(categoria ? { nome: categoria.nome, descricao: categoria.descricao ?? '' } : VAZIA)
  }

  function salvar(evento) {
    evento.preventDefault()
    const dados = { nome: formulario.nome, descricao: formulario.descricao || null }

    const acao = emEdicao?.id
      ? atualizar.mutateAsync({ id: emEdicao.id, ...dados })
      : criar.mutateAsync(dados)

    acao.then(() => setEmEdicao(null)).catch(() => {})
  }

  function confirmarInativacao() {
    inativar.mutateAsync(aInativar.id).then(() => setAInativar(null)).catch(() => {})
  }

  const lista = consulta.data ?? []
  const totalUnidades = lista.reduce((acc, c) => acc + (c.unidadesEmEstoque ?? 0), 0)

  return (
    <Layout
      titulo="Categorias"
      subtitulo="Organize o catálogo por grupos de produtos."
      menu={menu}
      acoes={
        podeEditar ? (
          <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
            Nova categoria
          </button>
        ) : null
      }
    >
      <section className="kpi-grid kpi-grid-3" aria-label="Resumo de categorias">
        <KpiCard
          tom="neutro"
          Icone={IconeCategorias}
          rotulo="Categorias ativas"
          valor={lista.length}
          meta={<span className="kpi-pill kpi-pill-ok">Catálogo</span>}
        />
        <KpiCard
          tom="mint"
          Icone={IconeProdutos}
          rotulo="Unidades em estoque"
          valor={totalUnidades}
          meta="Soma das categorias"
        />
        <KpiCard
          tom="alerta"
          Icone={IconeProdutos}
          rotulo="Produtos vinculados"
          valor={lista.reduce((acc, c) => acc + (c.totalProdutos ?? 0), 0)}
          meta="No catálogo ativo"
        />
      </section>

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      {consulta.isPending ? (
        <p className="text-body" style={{ color: 'var(--gray)' }}>
          Carregando categorias…
        </p>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma categoria cadastrada"
          descricao="As categorias organizam o catálogo por tipo de produto."
          acao={
            podeEditar ? (
              <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                Cadastrar a primeira
              </button>
            ) : null
          }
        />
      ) : (
        <section className="catalogo-grid" aria-label="Lista de categorias">
          {lista.map((categoria) => (
            <article key={categoria.id} className="catalogo-card">
              <div className="catalogo-card-topo">
                <ProdutoThumb nome={categoria.nome} categoria={categoria.nome} />
                {podeEditar ? (
                  <MenuAcoes
                    rotulo={`Ações de ${categoria.nome}`}
                    itens={[
                      { rotulo: 'Editar', onClick: () => abrirFormulario(categoria) },
                      { rotulo: 'Inativar', onClick: () => setAInativar(categoria), perigo: true },
                    ]}
                  />
                ) : null}
              </div>
              <h3>{categoria.nome}</h3>
              <p className="catalogo-card-desc">{categoria.descricao || 'Sem descrição'}</p>
              <dl className="catalogo-card-meta">
                <div>
                  <dt>Produtos</dt>
                  <dd>{categoria.totalProdutos ?? 0}</dd>
                </div>
                <div>
                  <dt>Em estoque</dt>
                  <dd>{categoria.unidadesEmEstoque ?? 0}</dd>
                </div>
              </dl>
              <div className="catalogo-card-barra" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min(100, ((categoria.totalProdutos ?? 0) / Math.max(1, lista.reduce((acc, c) => acc + (c.totalProdutos ?? 0), 0))) * 100)}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </section>
      )}

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar categoria' : 'Nova categoria'}
        subtitulo="Grupos usados nos filtros e no inventário."
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEmEdicao(null)}>
              Cancelar
            </button>
            <button type="submit" form="formulario-categoria" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="formulario-categoria" onSubmit={salvar} className="modal-corpo">
          <Campo
            id="categoria-nome"
            rotulo="Nome"
            obrigatorio
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            erro={erroDoServidor?.campos?.nome}
          />
          <Campo
            id="categoria-descricao"
            rotulo="Descrição"
            ajuda="Opcional."
            value={formulario.descricao}
            onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
            erro={erroDoServidor?.campos?.descricao}
          />
          {erroDoServidor && !erroDoServidor.campos && (
            <p className="campo-erro text-body-sm" role="alert">
              {erroDoServidor.mensagem}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        aberto={aInativar !== null}
        aoFechar={() => setAInativar(null)}
        titulo="Inativar categoria"
        subtitulo="Sai das listagens; o histórico permanece."
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAInativar(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmarInativacao}
              disabled={inativar.isPending}
            >
              {inativar.isPending ? 'Inativando…' : 'Inativar'}
            </button>
          </>
        }
      >
        <p className="text-body">
          A categoria <strong>{aInativar?.nome}</strong> sai das listagens. O histórico continua
          guardado e ela pode ser reativada depois.
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
