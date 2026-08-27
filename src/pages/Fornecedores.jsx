import { useState } from 'react'

import {
  useAtualizarFornecedor,
  useCriarFornecedor,
  useFornecedores,
  useInativarFornecedor,
} from '../api/fornecedores.js'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { Modal } from '../components/Modal.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const VAZIA = { nome: '', cnpj: '', contato_nome: '', telefone: '', email: '', observacao: '' }

// Função utilitária para aplicar máscara no CNPJ para exibição
function formatarCnpj(cnpj) {
  if (!cnpj) return '—'
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function Fornecedores() {
  const { temPapel } = useAuth()
  const podeEditar = temPapel('GESTOR')
  const menu = useMenuPrincipal()
  const consulta = useFornecedores()
  const criar = useCriarFornecedor()
  const atualizar = useAtualizarFornecedor()
  const inativar = useInativarFornecedor()

  const [emEdicao, setEmEdicao] = useState(null)
  const [aInativar, setAInativar] = useState(null)
  const [formulario, setFormulario] = useState(VAZIA)

  const salvando = criar.isPending || atualizar.isPending
  const erroDoServidor = criar.error ?? atualizar.error

  function abrirFormulario(fornecedor) {
    criar.reset()
    atualizar.reset()
    setEmEdicao(fornecedor ?? VAZIA)
    setFormulario(
      fornecedor
        ? {
            nome: fornecedor.nome,
            cnpj: fornecedor.cnpj ?? '',
            contato_nome: fornecedor.contato_nome ?? '',
            telefone: fornecedor.telefone ?? '',
            email: fornecedor.email ?? '',
            observacao: fornecedor.observacao ?? '',
          }
        : VAZIA
    )
  }

  function salvar(evento) {
    evento.preventDefault()
    const dados = {
      nome: formulario.nome,
      cnpj: formulario.cnpj || null,
      contato_nome: formulario.contato_nome || null,
      telefone: formulario.telefone || null,
      email: formulario.email || null,
      observacao: formulario.observacao || null,
    }

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
    { chave: 'cnpj', titulo: 'CNPJ', render: (f) => formatarCnpj(f.cnpj) },
    { chave: 'contato', titulo: 'Contato', render: (f) => f.contato_nome ?? '—' },
    { chave: 'telefone', titulo: 'Telefone', render: (f) => f.telefone ?? '—' },
    { chave: 'totalProdutos', titulo: 'Produtos', alinhamento: 'right', render: (f) => f.totalProdutos ?? 0 },
    {
      chave: 'acoes',
      titulo: 'Ações',
      alinhamento: 'right',
      render: (fornecedor) => (
        podeEditar ? (
          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => abrirFormulario(fornecedor)}>
              Editar
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setAInativar(fornecedor)}>
              Inativar
            </button>
          </div>
        ) : null
      ),
    },
  ].filter((coluna) => podeEditar || coluna.chave !== 'acoes')

  return (
    <Layout
      titulo="Fornecedores"
      menu={menu}
      acoes={podeEditar ? (
        <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
          Novo fornecedor
        </button>
      ) : null}
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
            titulo="Nenhum fornecedor cadastrado"
            descricao="Cadastre fornecedores para associá-los aos produtos do catálogo."
            acao={podeEditar ? (
              <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                Cadastrar o primeiro
              </button>
            ) : null}
          />
        }
      />

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar fornecedor' : 'Novo fornecedor'}
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEmEdicao(null)}>
              Cancelar
            </button>
            <button type="submit" form="formulario-fornecedor" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="formulario-fornecedor" onSubmit={salvar} className="modal-corpo">
          <Campo
            id="fornecedor-nome"
            rotulo="Nome"
            obrigatorio
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            erro={erroDoServidor?.campos?.nome}
          />
          <Campo
            id="fornecedor-cnpj"
            rotulo="CNPJ"
            ajuda="Opcional."
            value={formulario.cnpj}
            onChange={(e) => setFormulario({ ...formulario, cnpj: e.target.value })}
            erro={erroDoServidor?.campos?.cnpj}
          />
          <Campo
            id="fornecedor-contato_nome"
            rotulo="Nome do Contato"
            ajuda="Opcional."
            value={formulario.contato_nome}
            onChange={(e) => setFormulario({ ...formulario, contato_nome: e.target.value })}
            erro={erroDoServidor?.campos?.contato_nome}
          />
          <Campo
            id="fornecedor-telefone"
            rotulo="Telefone"
            ajuda="Opcional."
            value={formulario.telefone}
            onChange={(e) => setFormulario({ ...formulario, telefone: e.target.value })}
            erro={erroDoServidor?.campos?.telefone}
          />
          <Campo
            id="fornecedor-email"
            rotulo="E-mail"
            ajuda="Opcional."
            value={formulario.email}
            onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
            erro={erroDoServidor?.campos?.email}
          />
          <Campo
            id="fornecedor-observacao"
            rotulo="Observação"
            ajuda="Opcional."
            value={formulario.observacao}
            onChange={(e) => setFormulario({ ...formulario, observacao: e.target.value })}
            erro={erroDoServidor?.campos?.observacao}
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
        titulo="Inativar fornecedor"
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
          O fornecedor <strong>{aInativar?.nome}</strong> sai das listagens. O histórico continua
          guardado e ele pode ser reativado depois.
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
