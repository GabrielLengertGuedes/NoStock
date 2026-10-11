import { useState } from 'react'

import {
  useAtualizarFornecedor,
  useCriarFornecedor,
  useFornecedores,
  useInativarFornecedor,
  useReativarFornecedor,
} from '../api/fornecedores.js'
import { Campo } from '../components/Campo.jsx'
import { CampoComMascara } from '../components/CampoComMascara.jsx'
import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { IconeAlerta, IconeFornecedores, IconeProdutos } from '../components/IconesBioma.jsx'
import { KpiCard } from '../components/KpiCard.jsx'
import { Layout } from '../components/Layout.jsx'
import { ListaDeInativos } from '../components/ListaDeInativos.jsx'
import { MenuAcoes } from '../components/MenuAcoes.jsx'
import { Modal } from '../components/Modal.jsx'
import { ProdutoThumb } from '../components/ProdutoThumb.jsx'
import { TelefoneFornecedor } from '../components/TelefoneFornecedor.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { useToast } from '../hooks/useToast.js'
import { CARACTERE_CNPJ, mascararCnpj } from '../lib/cnpj.js'
import { CARACTERE_TELEFONE, formatarTelefone, mascararTelefone } from '../lib/telefone.js'

const VAZIA = { nome: '', cnpj: '', contato_nome: '', telefone: '', email: '', observacao: '' }

export function Fornecedores() {
  const { temPapel } = useAuth()
  const podeEditar = temPapel('GESTOR')
  const menu = useMenuPrincipal()
  // So o gestor ve os inativos: e ele quem pode reativar.
  const consulta = useFornecedores({ incluirInativos: podeEditar })
  const criar = useCriarFornecedor()
  const atualizar = useAtualizarFornecedor()
  const inativar = useInativarFornecedor()
  const reativar = useReativarFornecedor()
  const toast = useToast()

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
            cnpj: mascararCnpj(fornecedor.cnpj),
            contato_nome: fornecedor.contato_nome ?? '',
            telefone: formatarTelefone(fornecedor.telefone),
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

  function abrirInativacao(fornecedor) {
    // Sem o reset, o erro da ultima tentativa aparecia no modal da proxima.
    inativar.reset()
    setAInativar(fornecedor)
  }

  function confirmarInativacao() {
    inativar.mutateAsync(aInativar.id).then(() => setAInativar(null)).catch(() => {})
  }

  function reativarFornecedor(fornecedor) {
    reativar
      .mutateAsync(fornecedor.id)
      .then(() => toast.mostrar({ titulo: 'Fornecedor reativado', mensagem: fornecedor.nome }))
      .catch((erro) =>
        toast.mostrar({ tipo: 'erro', titulo: 'Não foi possível reativar', mensagem: erro.mensagem }),
      )
  }

  const lista = (consulta.data ?? []).filter((fornecedor) => fornecedor.ativo)
  const inativos = (consulta.data ?? []).filter((fornecedor) => !fornecedor.ativo)

  return (
    <Layout
      titulo="Fornecedores"
      subtitulo="Contatos e vínculos dos produtos do estoque."
      menu={menu}
      acoes={
        podeEditar ? (
          <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
            Novo fornecedor
          </button>
        ) : null
      }
    >
      <section className="kpi-grid kpi-grid-3" aria-label="Resumo de fornecedores">
        <KpiCard
          tom="neutro"
          Icone={IconeFornecedores}
          rotulo="Fornecedores ativos"
          valor={lista.length}
          meta={<span className="kpi-pill kpi-pill-ok">Cadastro</span>}
        />
        <KpiCard
          tom="mint"
          Icone={IconeProdutos}
          rotulo="Produtos vinculados"
          valor={lista.reduce((acc, f) => acc + (f.totalProdutos ?? 0), 0)}
          meta="No catálogo"
        />
        <KpiCard
          tom="alerta"
          Icone={IconeAlerta}
          rotulo="Sem produtos"
          valor={lista.filter((f) => !(f.totalProdutos > 0)).length}
          meta="Podem ser revisados"
        />
      </section>

      {consulta.isPending ? (
        <p className="text-body" style={{ color: 'var(--gray)' }}>
          Carregando fornecedores…
        </p>
      ) : consulta.isError ? (
        <div role="alert">
          <EstadoVazio titulo="Não foi possível carregar os fornecedores" descricao={consulta.error.mensagem} />
        </div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum fornecedor cadastrado"
          descricao="Cadastre fornecedores para associá-los aos produtos do catálogo."
          acao={
            podeEditar ? (
              <button type="button" className="btn btn-primary" onClick={() => abrirFormulario(null)}>
                Cadastrar o primeiro
              </button>
            ) : null
          }
        />
      ) : (
        <section className="catalogo-grid" aria-label="Lista de fornecedores">
          {lista.map((fornecedor) => (
            <article key={fornecedor.id} className="catalogo-card">
              <div className="catalogo-card-topo">
                <ProdutoThumb nome={fornecedor.nome} categoria={fornecedor.nome} />
                {podeEditar ? (
                  <MenuAcoes
                    rotulo={`Ações de ${fornecedor.nome}`}
                    itens={[
                      { rotulo: 'Editar', onClick: () => abrirFormulario(fornecedor) },
                      { rotulo: 'Inativar', onClick: () => abrirInativacao(fornecedor), perigo: true },
                    ]}
                  />
                ) : null}
              </div>
              <h3>{fornecedor.nome}</h3>
              <p className="sku-codigo">{mascararCnpj(fornecedor.cnpj) || '—'}</p>
              <div className="catalogo-contato">
                <span>{fornecedor.contato_nome || 'Sem contato'}</span>
                {fornecedor.telefone ? (
                  <TelefoneFornecedor nome={fornecedor.nome} telefone={fornecedor.telefone} />
                ) : (
                  <span>—</span>
                )}
                {fornecedor.email ? (
                  <a href={`mailto:${fornecedor.email}`}>{fornecedor.email}</a>
                ) : null}
              </div>
              <dl className="catalogo-card-meta">
                <div>
                  <dt>Produtos</dt>
                  <dd>{fornecedor.totalProdutos ?? 0}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd style={{ fontFamily: 'inherit', fontSize: 12 }}>{fornecedor.email || '—'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      <ListaDeInativos
        titulo="Fornecedores inativos"
        descricao="Fora das listagens e dos cadastros de produto. Reative para voltar a usar."
        itens={inativos}
        aoReativar={reativarFornecedor}
        reativando={reativar.isPending}
      />

      <Modal
        aberto={emEdicao !== null}
        aoFechar={() => setEmEdicao(null)}
        titulo={emEdicao?.id ? 'Editar fornecedor' : 'Novo fornecedor'}
        subtitulo="Contato e vínculo para o catálogo."
        tamanho="lg"
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
        <form id="formulario-fornecedor" onSubmit={salvar} className="modal-corpo produto-form-campos">
          <Campo
            id="fornecedor-nome"
            rotulo="Nome"
            obrigatorio
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            erro={erroDoServidor?.campos?.nome}
          />
          <div className="produto-form-duas-colunas">
          <CampoComMascara
            id="fornecedor-cnpj"
            rotulo="CNPJ"
            ajuda="Opcional."
            autoCapitalize="characters"
            placeholder="00.000.000/0000-00"
            value={formulario.cnpj}
            mascarar={mascararCnpj}
            aceita={CARACTERE_CNPJ}
            aoMudar={(cnpj) => setFormulario({ ...formulario, cnpj })}
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
          </div>
          <div className="produto-form-duas-colunas">
          <CampoComMascara
            id="fornecedor-telefone"
            rotulo="Telefone"
            type="tel"
            ajuda="Com DDD. Informe telefone, e-mail ou os dois."
            placeholder="(47) 99999-8888"
            value={formulario.telefone}
            mascarar={mascararTelefone}
            aceita={CARACTERE_TELEFONE}
            aoMudar={(telefone) => setFormulario({ ...formulario, telefone })}
            erro={erroDoServidor?.campos?.telefone}
          />
          <Campo
            id="fornecedor-email"
            rotulo="E-mail"
            type="email"
            ajuda="Informe telefone, e-mail ou os dois."
            value={formulario.email}
            onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
            erro={erroDoServidor?.campos?.email}
          />
          </div>
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
