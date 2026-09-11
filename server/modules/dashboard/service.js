import { obterEnv } from '../../config/env.js'
import { listarResumo } from './repository.js'

const PRIORIDADE = {
  SEM_ESTOQUE: 1,
  CRITICO: 2,
  BAIXO: 3,
}

function formatarDiaEmFusoDaLoja(data = new Date(), timeZone = obterEnv().lojaTimeZone) {
  const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const partes = formatador.formatToParts(data)
  const mapa = Object.fromEntries(
    partes.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  )
  return `${mapa.year}-${mapa.month}-${mapa.day}`
}

export async function obterDashboard() {
  const resumo = await listarResumo()

  const produtosAtencao = [...resumo.produtosAtencao].sort(
    (a, b) => (PRIORIDADE[a.statusEstoque] ?? 99) - (PRIORIDADE[b.statusEstoque] ?? 99),
  )

  const cards = [
    {
      chave: 'total',
      rotulo: 'Total de itens',
      valor: resumo.totalItens,
      meta: 'Catálogo ativo',
      tom: 'neutro',
      barra: 100,
    },
    {
      chave: 'baixo',
      rotulo: 'Estoque baixo',
      valor: resumo.totalBaixo,
      meta: 'ATENÇÃO',
      tom: 'alerta',
      barra: resumo.totalItens ? Math.round((resumo.totalBaixo / resumo.totalItens) * 100) : 0,
    },
    {
      chave: 'zerado',
      rotulo: 'Sem estoque',
      valor: resumo.totalZerado,
      meta: 'Urgente',
      tom: 'urgente',
      barra: resumo.totalItens ? Math.round((resumo.totalZerado / resumo.totalItens) * 100) : 0,
    },
    {
      chave: 'entradas',
      rotulo: 'Entradas (hoje)',
      valor: resumo.totalEntradasHoje,
      meta: 'Ver histórico',
      tom: 'mint',
      barra: 0,
    },
  ]

  return {
    dados: {
      cards,
      produtosAtencao,
      dia: formatarDiaEmFusoDaLoja(),
    },
    meta: {
      total: produtosAtencao.length,
      pagina: 1,
      porPagina: produtosAtencao.length,
      totalPaginas: 1,
    },
  }
}
