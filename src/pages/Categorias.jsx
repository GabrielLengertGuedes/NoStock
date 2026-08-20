import { useState } from 'react'

import {
  useAtualizarCategoria,
  useCategorias,
  useCriarCategoria,
  useInativarCategoria,
} from '../api/categorias.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { Modal } from '../components/Modal.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const VAZIA = { nome: '', descricao: '' }

export function Categorias() {
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

  const colunas = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'descricao', titulo: 'Descrição', render: (c) => c.descricao ?? '—' },
    {
      chave: 'acoes',
      titulo: 'Ações',
      alinhamento: 'right',
      render: (categoria) => (
        <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => abrirFormulario(categoria)}>
            Editar
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setAInativar(categoria)}>
            Inativar
          </button>
        </div>
      ),
    },
  ]

  return (
    <Layout
      titulo="Categorias"
      menu={menu}
      acoes={
        <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
          Nova categoria
        </button>
      }
    >
      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      <Tabela
        colunas={colunas}
        dados={consulta.data ?? []}
        carregando={consulta.isPending}
        vazio={
          <EstadoVazio
            titulo="Nenhuma categoria cadastrada"
            descricao="As categorias organizam o catálogo por tipo de produto."
            acao={
              <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                Cadastrar a primeira
              </button>
            }
          />
        }
      />

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar categoria' : 'Nova categoria'}
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
