import { useState } from 'react'

import {
  useAtualizarUsuario,
  useCriarUsuario,
  useInativarUsuario,
  useReativarUsuario,
  useRedefinirSenhaUsuario,
  useUsuarios,
} from '../api/usuarios.js'
import { AvatarIniciais } from '../components/AvatarIniciais.jsx'
import { Campo } from '../components/Campo.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { IconeUsuarios } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { MenuAcoes } from '../components/MenuAcoes.jsx'
import { Modal } from '../components/Modal.jsx'
import { Tabela } from '../components/Tabela.jsx'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'

const FORM_VAZIO = { nome: '', email: '', senha: '', papel: 'OPERADOR' }

function rotuloPapel(papel) {
  return papel === 'GESTOR' ? 'Gestor' : 'Operador'
}

export function Usuarios() {
  const menu = useMenuPrincipal()
  const [filtroAtivo, setFiltroAtivo] = useState('true')
  const consulta = useUsuarios(filtroAtivo)
  const criar = useCriarUsuario()
  const atualizar = useAtualizarUsuario()
  const inativar = useInativarUsuario()
  const reativar = useReativarUsuario()
  const redefinirSenha = useRedefinirSenhaUsuario()

  const [emEdicao, setEmEdicao] = useState(null)
  const [formulario, setFormulario] = useState(FORM_VAZIO)
  const [aInativar, setAInativar] = useState(null)
  const [aRedefinir, setARedefinir] = useState(null)
  const [senhaNova, setSenhaNova] = useState('')

  const salvando = criar.isPending || atualizar.isPending
  const erroDoServidor = criar.error ?? atualizar.error
  const criando = emEdicao !== null && !emEdicao.id

  function abrirFormulario(usuario) {
    criar.reset()
    atualizar.reset()
    setEmEdicao(usuario ?? FORM_VAZIO)
    setFormulario(
      usuario
        ? { nome: usuario.nome, email: usuario.email, senha: '', papel: usuario.papel }
        : FORM_VAZIO,
    )
  }

  function salvar(evento) {
    evento.preventDefault()

    const acao = emEdicao?.id
      ? atualizar.mutateAsync({
          id: emEdicao.id,
          nome: formulario.nome,
          email: formulario.email,
          papel: formulario.papel,
        })
      : criar.mutateAsync({
          nome: formulario.nome,
          email: formulario.email,
          senha: formulario.senha,
          papel: formulario.papel,
        })

    acao.then(() => setEmEdicao(null)).catch(() => {})
  }

  function confirmarInativacao() {
    inativar.mutateAsync(aInativar.id).then(() => setAInativar(null)).catch(() => {})
  }

  function confirmarRedefinicao(evento) {
    evento.preventDefault()
    redefinirSenha
      .mutateAsync({ id: aRedefinir.id, senhaNova })
      .then(() => {
        setARedefinir(null)
        setSenhaNova('')
        redefinirSenha.reset()
      })
      .catch(() => {})
  }

  const colunas = [
    {
      chave: 'nome',
      titulo: 'Pessoa',
      render: (usuario) => (
        <div className="produto-celula">
          <AvatarIniciais nome={usuario.nome} />
          <div>
            <p className="produto-nome">{usuario.nome}</p>
            <p className="produto-meta">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      chave: 'papel',
      titulo: 'Papel',
      render: (usuario) => (
        <span className={`chip-papel${usuario.papel === 'GESTOR' ? ' chip-papel-gestor' : ''}`}>
          {rotuloPapel(usuario.papel)}
        </span>
      ),
    },
    {
      chave: 'ativo',
      titulo: 'Status',
      render: (usuario) => (
        <span className={`chip-status ${usuario.ativo ? 'chip-status-ativo' : 'chip-status-inativo'}`}>
          {usuario.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      chave: 'acoes',
      titulo: '',
      alinhamento: 'right',
      render: (usuario) => {
        const itens = usuario.ativo
          ? [
              { rotulo: 'Editar', onClick: () => abrirFormulario(usuario) },
              {
                rotulo: 'Redefinir senha',
                onClick: () => {
                  redefinirSenha.reset()
                  setSenhaNova('')
                  setARedefinir(usuario)
                },
              },
              { rotulo: 'Inativar', onClick: () => setAInativar(usuario), perigo: true },
            ]
          : [
              {
                rotulo: 'Reativar',
                onClick: () => reativar.mutate(usuario.id),
              },
            ]
        return <MenuAcoes rotulo={`Ações de ${usuario.nome}`} itens={itens} />
      },
    },
  ]

  const lista = consulta.data ?? []

  return (
    <Layout
      titulo="Usuários"
      subtitulo="Gerencie acessos de operadores e gestores."
      menu={menu}
      acoes={
        <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
          Novo usuário
        </button>
      }
    >

      <section className="kpi-grid kpi-grid-3" aria-label="Resumo da equipe">
        <KpiCard tom="neutro" Icone={IconeUsuarios} rotulo="Na lista" valor={lista.length} meta="Filtro atual" />
        <KpiCard
          tom="mint"
          Icone={IconeUsuarios}
          rotulo="Gestores"
          valor={lista.filter((u) => u.papel === 'GESTOR').length}
          meta="Acesso total"
        />
        <KpiCard
          tom="alerta"
          Icone={IconeUsuarios}
          rotulo="Operadores"
          valor={lista.filter((u) => u.papel === 'OPERADOR').length}
          meta="Operação do estoque"
        />
      </section>

      <div className="filtros-linha">
        <div className="segmented" role="tablist" aria-label="Filtro de status de usuários">
          {[
            { valor: 'true', rotulo: 'Ativos' },
            { valor: 'false', rotulo: 'Inativos' },
            { valor: 'todos', rotulo: 'Todos' },
          ].map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              role="tab"
              aria-selected={filtroAtivo === opcao.valor}
              className={`segmented-btn${filtroAtivo === opcao.valor ? ' segmented-btn-ativo' : ''}`}
              onClick={() => setFiltroAtivo(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {consulta.isError && (
        <p className="campo-erro text-body" role="alert">
          {consulta.error.mensagem}
        </p>
      )}

      {reativar.error && (
        <p className="campo-erro text-body" role="alert">
          {reativar.error.mensagem}
        </p>
      )}

      <section className="painel">
        <div className="painel-cabecalho">
          <div>
            <h2 className="text-h3">Equipe da loja</h2>
            <p className="text-body-sm" style={{ color: 'var(--gray)' }}>
              Gestores e operadores com acesso ao NoStock.
            </p>
          </div>
        </div>
        <Tabela
          colunas={colunas}
          dados={lista}
          carregando={consulta.isPending}
          vazio={
            <EstadoVazio
              titulo="Nenhum usuário neste filtro"
              descricao="Cadastre operadores e gestores para a equipe da loja."
              acao={
                <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                  Cadastrar o primeiro
                </button>
              }
            />
          }
        />
      </section>

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar usuário' : 'Novo usuário'}
        subtitulo="Contas internas — só gestores cadastram a equipe."
        acoes={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEmEdicao(null)}>
              Cancelar
            </button>
            <button type="submit" form="formulario-usuario" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="formulario-usuario" onSubmit={salvar} className="modal-corpo">
          <Campo
            id="usuario-nome"
            rotulo="Nome"
            obrigatorio
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            erro={erroDoServidor?.campos?.nome}
          />
          <Campo
            id="usuario-email"
            rotulo="E-mail"
            type="email"
            obrigatorio
            value={formulario.email}
            onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
            erro={erroDoServidor?.campos?.email}
          />
          {criando && (
            <Campo
              id="usuario-senha"
              rotulo="Senha inicial"
              type="password"
              obrigatorio
              ajuda="Mínimo de 8 caracteres."
              value={formulario.senha}
              onChange={(e) => setFormulario({ ...formulario, senha: e.target.value })}
              erro={erroDoServidor?.campos?.senha}
            />
          )}
          <Campo id="usuario-papel" rotulo="Papel" obrigatorio erro={erroDoServidor?.campos?.papel}>
            <select
              id="usuario-papel"
              className="input-field"
              value={formulario.papel}
              onChange={(e) => setFormulario({ ...formulario, papel: e.target.value })}
              aria-invalid={erroDoServidor?.campos?.papel ? 'true' : undefined}
            >
              <option value="OPERADOR">Operador</option>
              <option value="GESTOR">Gestor</option>
            </select>
          </Campo>
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
        titulo="Inativar usuário"
        subtitulo="O acesso é bloqueado; o histórico permanece."
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
          <strong>{aInativar?.nome}</strong> não conseguirá mais entrar. O histórico permanece e o
          usuário pode ser reativado depois.
        </p>
        {inativar.error && (
          <p className="campo-erro text-body-sm" role="alert">
            {inativar.error.mensagem}
          </p>
        )}
      </Modal>

      <Modal
        aberto={aRedefinir !== null}
        aoFechar={() => {
          setARedefinir(null)
          setSenhaNova('')
        }}
        titulo="Redefinir senha"
        subtitulo={aRedefinir ? `Nova senha para ${aRedefinir.nome}.` : undefined}
        acoes={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setARedefinir(null)
                setSenhaNova('')
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="formulario-senha-usuario"
              className="btn btn-primary"
              disabled={redefinirSenha.isPending}
            >
              {redefinirSenha.isPending ? 'Salvando…' : 'Salvar senha'}
            </button>
          </>
        }
      >
        <form id="formulario-senha-usuario" onSubmit={confirmarRedefinicao} className="modal-corpo">
          <p className="text-body-sm" style={{ color: 'var(--slate)' }}>
            Nova senha para <strong>{aRedefinir?.nome}</strong>.
          </p>
          <Campo
            id="usuario-senha-nova"
            rotulo="Senha nova"
            type="password"
            obrigatorio
            ajuda="Mínimo de 8 caracteres."
            value={senhaNova}
            onChange={(e) => setSenhaNova(e.target.value)}
            erro={redefinirSenha.error?.campos?.senhaNova}
          />
          {redefinirSenha.error && !redefinirSenha.error.campos && (
            <p className="campo-erro text-body-sm" role="alert">
              {redefinirSenha.error.mensagem}
            </p>
          )}
        </form>
      </Modal>
    </Layout>
  )
}
