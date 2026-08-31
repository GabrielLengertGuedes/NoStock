import { useState } from 'react'

import { useRegistrarMovimentacao } from '../api/movimentacoes.js'
import { useProdutos } from '../api/produtos.js'
import { BadgeStatus } from './BadgeStatus.jsx'
import { Campo } from './Campo.jsx'
import { Modal } from './Modal.jsx'

const MOTIVOS = {
  ENTRADA: [
    { valor: 'COMPRA', rotulo: 'Compra' },
    { valor: 'DEVOLUCAO', rotulo: 'Devolução' },
  ],
  SAIDA: [
    { valor: 'VENDA', rotulo: 'Venda' },
    { valor: 'DESCARTE', rotulo: 'Descarte' },
  ],
}

export function ModalMovimentacao({ aberto, aoFechar, tipo, produtoInicial = null }) {
  const registrar = useRegistrarMovimentacao()
  const [buscaProduto, setBuscaProduto] = useState(produtoInicial?.nome ?? '')
  const [formulario, setFormulario] = useState(() => ({
    produtoId: produtoInicial?.id ? String(produtoInicial.id) : '',
    quantidade: '',
    motivo: MOTIVOS[tipo]?.[0]?.valor ?? '',
    observacao: '',
  }))
  const [resultado, setResultado] = useState(null)

  const motivos = MOTIVOS[tipo] ?? []
  const produtoFixo = produtoInicial != null
  const titulo = tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar saída'

  const consultaProdutos = useProdutos({
    busca: produtoFixo ? undefined : buscaProduto || undefined,
    pagina: 1,
    porPagina: 50,
  })
  const produtos = consultaProdutos.data?.dados ?? []

  const produtoSelecionado =
    produtoInicial ?? produtos.find((produto) => String(produto.id) === formulario.produtoId)

  const erro = registrar.error
  const salvando = registrar.isPending

  function fechar() {
    registrar.reset()
    aoFechar()
  }

  function salvar(evento) {
    evento.preventDefault()

    registrar
      .mutateAsync({
        produtoId: Number(formulario.produtoId),
        tipo,
        motivo: formulario.motivo,
        quantidade: Number(formulario.quantidade),
        observacao: formulario.observacao.trim() || null,
      })
      .then((dados) => setResultado(dados))
      .catch(() => {})
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={fechar}
      titulo={titulo}
      acoes={
        resultado ? (
          <button type="button" className="btn btn-primary" onClick={fechar}>
            Fechar
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={fechar} disabled={salvando}>
              Cancelar
            </button>
            <button
              type="submit"
              form="formulario-movimentacao"
              className="btn btn-primary"
              disabled={salvando || !formulario.produtoId}
            >
              {salvando ? 'Registrando…' : 'Registrar'}
            </button>
          </>
        )
      }
    >
      {resultado ? (
        <div className="modal-corpo" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <p className="text-body">Movimentação registrada com sucesso.</p>
          <p className="text-body">
            Saldo: <strong>{resultado.saldoAnterior}</strong> → <strong>{resultado.saldoPosterior}</strong>{' '}
            unidade(s)
          </p>
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <span className="text-body-sm" style={{ color: 'var(--slate)' }}>
              Status do estoque:
            </span>
            <BadgeStatus status={resultado.statusEstoqueResultante} />
          </div>
        </div>
      ) : (
        <form id="formulario-movimentacao" onSubmit={salvar} className="modal-corpo">
          {produtoFixo ? (
            <p className="text-body">
              <strong>{produtoInicial.nome}</strong> — saldo atual:{' '}
              <strong>{produtoInicial.quantidadeAtual}</strong> unidade(s)
            </p>
          ) : (
            <>
              <Campo
                id="movimentacao-busca"
                rotulo="Buscar produto"
                type="search"
                placeholder="Digite o nome do produto"
                value={buscaProduto}
                onChange={(evento) => setBuscaProduto(evento.target.value)}
              />
              <Campo
                id="movimentacao-produtoId"
                rotulo="Produto"
                obrigatorio
                erro={erro?.campos?.produtoId}
              >
                <select
                  id="movimentacao-produtoId"
                  className="input-field"
                  value={formulario.produtoId}
                  onChange={(evento) =>
                    setFormulario((atual) => ({ ...atual, produtoId: evento.target.value }))
                  }
                  aria-invalid={erro?.campos?.produtoId ? 'true' : undefined}
                  required
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} — saldo {produto.quantidadeAtual}
                    </option>
                  ))}
                </select>
              </Campo>
            </>
          )}

          {!produtoFixo && produtoSelecionado && (
            <p className="text-body-sm" style={{ color: 'var(--slate)' }}>
              Saldo atual: <strong>{produtoSelecionado.quantidadeAtual}</strong> unidade(s)
            </p>
          )}

          <Campo id="movimentacao-motivo" rotulo="Motivo" obrigatorio erro={erro?.campos?.motivo}>
            <select
              id="movimentacao-motivo"
              className="input-field"
              value={formulario.motivo}
              onChange={(evento) =>
                setFormulario((atual) => ({ ...atual, motivo: evento.target.value }))
              }
              aria-invalid={erro?.campos?.motivo ? 'true' : undefined}
              required
            >
              {motivos.map((motivo) => (
                <option key={motivo.valor} value={motivo.valor}>
                  {motivo.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="movimentacao-quantidade"
            rotulo="Quantidade"
            type="number"
            min="1"
            step="1"
            obrigatorio
            value={formulario.quantidade}
            onChange={(evento) =>
              setFormulario((atual) => ({ ...atual, quantidade: evento.target.value }))
            }
            erro={erro?.campos?.quantidade}
          />

          <Campo
            id="movimentacao-observacao"
            rotulo="Observação"
            ajuda="Opcional."
            value={formulario.observacao}
            onChange={(evento) =>
              setFormulario((atual) => ({ ...atual, observacao: evento.target.value }))
            }
            erro={erro?.campos?.observacao}
          />

          {erro && !erro.campos && (
            <p className="campo-erro text-body-sm" role="alert">
              {erro.mensagem}
            </p>
          )}
        </form>
      )}
    </Modal>
  )
}
