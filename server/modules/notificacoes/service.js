import { obterEnv } from '../../config/env.js'
import { AppError } from '../../shared/AppError.js'
import { montarAlerta, statusQuePiorou } from './alerta.js'
import { enviar, pushConfigurado } from './envio.js'
import * as repositorio from './repository.js'

const ALERTA_DE_TESTE = {
  titulo: 'Alertas ligados',
  corpo: 'Este celular vai receber os alertas de estoque da Bioma.',
  url: '/m/conta',
  tag: 'teste',
}

const naoInscrito = () =>
  new AppError('NAO_ENCONTRADO', 'Este celular não está inscrito nos alertas.')

export function chavePublica() {
  return { chavePublica: obterEnv().vapid?.chavePublica ?? null }
}

export function listar(usuarioId) {
  return repositorio.listarDoUsuario(usuarioId)
}

export function salvar(usuarioId, { endpoint, chaves, nivel }) {
  return repositorio.salvar({ usuarioId, endpoint, p256dh: chaves.p256dh, auth: chaves.auth, nivel })
}

export function remover(usuarioId, endpoint) {
  return repositorio.remover({ usuarioId, endpoint })
}

export async function testar(usuarioId, endpoint) {
  if (!pushConfigurado()) {
    throw new AppError('SERVICO_INDISPONIVEL', 'Os alertas não estão configurados neste servidor.')
  }

  const inscricao = await repositorio.buscarDoUsuario({ usuarioId, endpoint })
  if (!inscricao) throw naoInscrito()

  const resultado = await enviar(inscricao, ALERTA_DE_TESTE)

  if (resultado === 'expirada') {
    await repositorio.removerExpiradas([endpoint])
    throw new AppError(
      'REGRA_NEGOCIO',
      'A inscrição deste celular expirou. Ative os alertas de novo.',
    )
  }
  if (resultado === 'falhou') {
    throw new AppError(
      'SERVICO_INDISPONIVEL',
      'O serviço de notificações não respondeu. Tente de novo em instantes.',
    )
  }
}

/**
 * Chamado depois que a movimentacao ja foi gravada. Avisa os aparelhos
 * inscritos quando o status do produto piorou; inscricao que o servico de push
 * deu como morta sai da tabela.
 */
export async function avisarSePiorou(movimentacao) {
  if (!pushConfigurado()) return

  const status = statusQuePiorou(movimentacao)
  if (!status) return

  const inscricoes = await repositorio.destinatarios({ status, autorId: movimentacao.usuario.id })
  if (inscricoes.length === 0) return

  const produto = await repositorio.dadosDoProduto(movimentacao.produtoId)
  const alerta = montarAlerta({ status, produto, movimentacao })

  const resultados = await Promise.all(inscricoes.map((inscricao) => enviar(inscricao, alerta)))
  const expiradas = inscricoes.filter((_, indice) => resultados[indice] === 'expirada')

  await repositorio.removerExpiradas(expiradas.map((inscricao) => inscricao.endpoint))
}
