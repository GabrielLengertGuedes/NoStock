import { useState } from 'react'

import { useRegistrarMovimentacao } from '../../api/movimentacoes.js'
import { useProdutos } from '../../api/produtos.js'
import { useAoPararDeDigitar } from '../../hooks/useAoPararDeDigitar.js'
import { useConectado } from '../../hooks/useConectado.js'
import { ROTULO_MOTIVO } from '../../lib/estoqueMovel.js'
import { BadgeStatus } from '../BadgeStatus.jsx'
import { IconeAvancar, IconeBusca, IconeCheck, IconeMenos, IconePlus } from '../IconesBioma.jsx'
import { ProdutoThumb } from '../ProdutoThumb.jsx'
import { Folha } from './Folha.jsx'

// Os mesmos motivos do modal do computador. Ajuste de inventário fica fora:
// exige gestor e observação, e é tarefa de conferência, não do dia a dia.
const MOTIVOS = {
  ENTRADA: ['COMPRA', 'DEVOLUCAO'],
  SAIDA: ['VENDA', 'DESCARTE'],
}

function EscolherProduto({ aoEscolher }) {
  const [texto, setTexto] = useState('')
  const [termo, setTermo] = useState('')
  const adiada = useAoPararDeDigitar((valor) => setTermo(valor.trim()))
  const consulta = useProdutos({ busca: termo || undefined, pagina: 1, porPagina: 8 }, { enabled: Boolean(termo) })
  const produtos = consulta.data?.dados ?? []

  return (
    <div className="movel-campo">
      <label className="movel-campo-rotulo" htmlFor="registro-busca">
        Produto
      </label>
      <div className="movel-busca">
        <IconeBusca size={18} />
        <input
          id="registro-busca"
          type="search"
          placeholder="Digite o nome do produto"
          autoComplete="off"
          enterKeyHint="search"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            adiada.agendar(evento.target.value)
          }}
        />
      </div>

      {!termo ? null : consulta.isPending ? (
        <p className="movel-dica">Buscando…</p>
      ) : consulta.isError ? (
        <p className="movel-erro" role="alert">
          {consulta.error.mensagem}
        </p>
      ) : produtos.length === 0 ? (
        <p className="movel-dica">Nenhum produto com esse nome.</p>
      ) : (
        <ul className="movel-lista movel-resultados">
          {produtos.map((produto) => (
            <li key={produto.id}>
              <button type="button" className="movel-linha" onClick={() => aoEscolher(produto)}>
                <ProdutoThumb id={produto.id} nome={produto.nome} categoria={produto.categoria?.nome} />
                <span className="movel-linha-texto">
                  <span className="movel-linha-nome">{produto.nome}</span>
                  <span className="movel-linha-meta">
                    saldo {produto.quantidadeAtual} · mín {produto.estoqueMinimo ?? 0}
                  </span>
                </span>
                <IconeAvancar size={18} className="movel-seta" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Resultado({ resultado, aoRegistrarOutra, aoConcluir }) {
  return (
    <>
      <div className="movel-feito">
        <span className="movel-feito-icone" aria-hidden="true">
          <IconeCheck size={28} />
        </span>
        <p className="movel-subtitulo">{resultado.produtoNome}</p>
      </div>
      <p className="movel-delta" aria-label={`Saldo foi de ${resultado.saldoAnterior} para ${resultado.saldoPosterior} unidades`}>
        <s>{resultado.saldoAnterior}</s>
        <IconeAvancar size={20} />
        <span>
          {resultado.saldoPosterior}
          <small> un</small>
        </span>
      </p>
      <dl className="movel-pares">
        <div className="movel-par">
          <dt>Status do estoque</dt>
          <dd>
            <BadgeStatus status={resultado.statusEstoqueResultante} />
          </dd>
        </div>
        <div className="movel-par">
          <dt>Motivo</dt>
          <dd>{ROTULO_MOTIVO[resultado.motivo]}</dd>
        </div>
      </dl>
      <div className="movel-duas">
        <button type="button" className="movel-botao movel-botao-secundario" onClick={aoRegistrarOutra}>
          Registrar outra
        </button>
        <button type="button" className="movel-botao movel-botao-primario" onClick={aoConcluir}>
          Concluir
        </button>
      </div>
    </>
  )
}

/**
 * Registrar entrada ou saída pelo celular. Aberta de um produto, ele já vem
 * escolhido; pelo botão Registrar, começa pela busca.
 */
export function FolhaMovimentacao({ tipoInicial = 'ENTRADA', produtoInicial = null, aoFechar }) {
  const registrar = useRegistrarMovimentacao()
  const conectado = useConectado()

  const [tipo, setTipo] = useState(tipoInicial)
  const [motivo, setMotivo] = useState(MOTIVOS[tipoInicial][0])
  const [produto, setProduto] = useState(produtoInicial)
  const [quantidade, setQuantidade] = useState('')
  const [observacao, setObservacao] = useState('')
  const [resultado, setResultado] = useState(null)

  const numero = Number(quantidade)
  const quantidadeValida = quantidade !== '' && Number.isInteger(numero) && numero > 0
  const saldo = produto?.quantidadeAtual ?? 0
  const saldoDepois = tipo === 'ENTRADA' ? saldo + numero : saldo - numero
  const faltaSaldo = tipo === 'SAIDA' && quantidadeValida && saldoDepois < 0
  const erro = registrar.error
  const palavra = tipo === 'ENTRADA' ? 'entrada' : 'saída'

  function trocarTipo(novo) {
    setTipo(novo)
    setMotivo(MOTIVOS[novo][0])
    registrar.reset()
  }

  function ajustar(passo) {
    const atual = Number.isInteger(numero) ? numero : 0
    setQuantidade(String(Math.max(1, atual + passo)))
  }

  function enviar(evento) {
    evento.preventDefault()
    registrar
      .mutateAsync({
        produtoId: produto.id,
        tipo,
        motivo,
        quantidade: numero,
        observacao: observacao.trim() || null,
      })
      .then((dados) => setResultado({ ...dados, produtoNome: produto.nome }))
      .catch(() => {})
  }

  // Tipo e motivo ficam: quem confere uma nota registra vários itens em sequência.
  function registrarOutra() {
    registrar.reset()
    setQuantidade('')
    setObservacao('')
    setProduto(
      produtoInicial
        ? { ...produto, quantidadeAtual: resultado.saldoPosterior, statusEstoque: resultado.statusEstoqueResultante }
        : null,
    )
    setResultado(null)
  }

  if (resultado) {
    return (
      <Folha titulo={resultado.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Saída registrada'} aoFechar={aoFechar}>
        <Resultado resultado={resultado} aoRegistrarOutra={registrarOutra} aoConcluir={aoFechar} />
      </Folha>
    )
  }

  return (
    <Folha titulo="Registrar movimentação" aoFechar={aoFechar}>
      <div className="movel-segmento" role="group" aria-label="Tipo de movimentação">
        <button type="button" aria-pressed={tipo === 'ENTRADA'} onClick={() => trocarTipo('ENTRADA')}>
          Entrada
        </button>
        <button type="button" aria-pressed={tipo === 'SAIDA'} onClick={() => trocarTipo('SAIDA')}>
          Saída
        </button>
      </div>

      {!produto ? (
        <EscolherProduto aoEscolher={setProduto} />
      ) : (
        <form className="movel-formulario" onSubmit={enviar}>
          <div className="movel-campo">
            <p className="movel-campo-rotulo">Produto</p>
            <div className="movel-escolhido">
              <ProdutoThumb id={produto.id} nome={produto.nome} categoria={produto.categoria?.nome} />
              <span className="movel-linha-texto">
                <span className="movel-linha-nome">{produto.nome}</span>
                <span className="movel-linha-meta">
                  saldo {saldo} · mín {produto.estoqueMinimo ?? 0}
                </span>
              </span>
              {produtoInicial ? null : (
                <button type="button" className="movel-link" onClick={() => setProduto(null)}>
                  Trocar
                </button>
              )}
            </div>
          </div>

          <div className="movel-campo">
            <p className="movel-campo-rotulo">Motivo</p>
            <div className="movel-motivos" role="group" aria-label="Motivo">
              {MOTIVOS[tipo].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className="movel-motivo"
                  aria-pressed={motivo === valor}
                  onClick={() => setMotivo(valor)}
                >
                  {ROTULO_MOTIVO[valor]}
                </button>
              ))}
            </div>
          </div>

          <div className="movel-campo">
            <label className="movel-campo-rotulo" htmlFor="registro-quantidade">
              Quantidade
            </label>
            <div className="movel-quantidade">
              <button type="button" className="movel-passo" onClick={() => ajustar(-1)} aria-label="Uma unidade a menos">
                <IconeMenos size={20} />
              </button>
              <input
                id="registro-quantidade"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                placeholder="0"
                value={quantidade}
                onChange={(evento) => setQuantidade(evento.target.value)}
                aria-invalid={erro?.campos?.quantidade || faltaSaldo ? 'true' : undefined}
                aria-describedby="registro-quantidade-dica"
              />
              <button type="button" className="movel-passo" onClick={() => ajustar(1)} aria-label="Uma unidade a mais">
                <IconePlus size={20} />
              </button>
            </div>
            <p id="registro-quantidade-dica" className={faltaSaldo || erro?.campos?.quantidade ? 'movel-erro' : 'movel-dica'}>
              {erro?.campos?.quantidade ??
                (faltaSaldo
                  ? `Saldo insuficiente: há ${saldo} un.`
                  : quantidadeValida
                    ? `Saldo depois da ${palavra}: ${saldoDepois} un`
                    : `Saldo atual: ${saldo} un`)}
            </p>
          </div>

          <div className="movel-campo">
            <label className="movel-campo-rotulo" htmlFor="registro-observacao">
              Observação <span className="movel-opcional">opcional</span>
            </label>
            <input
              id="registro-observacao"
              className="movel-entrada"
              maxLength={255}
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
            />
          </div>

          {!conectado ? (
            <p className="movel-aviso" role="status">
              Sem conexão. A movimentação só é registrada com internet, para o saldo não ficar errado.
            </p>
          ) : erro && !erro.campos ? (
            <p className="movel-erro" role="alert">
              {erro.mensagem}
            </p>
          ) : null}

          <button
            type="submit"
            className="movel-botao movel-botao-primario movel-botao-bloco"
            disabled={!quantidadeValida || faltaSaldo || registrar.isPending || !conectado}
          >
            {registrar.isPending
              ? 'Registrando…'
              : `Registrar ${palavra}${quantidadeValida ? ` de ${numero} un` : ''}`}
          </button>
        </form>
      )}
    </Folha>
  )
}
