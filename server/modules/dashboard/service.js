import { obterEnv } from '../../config/env.js'
import { limitesDoDiaAtual } from '../../shared/horarioLoja.js'
import * as repositorio from './repository.js'

export async function obterResumo() {
  const fusoHorario = obterEnv().fusoHorario
  const { inicio, fim } = limitesDoDiaAtual(fusoHorario)

  const [cards, produtosAtencao] = await Promise.all([
    repositorio.obterCards({ inicioDoDia: inicio, fimDoDia: fim }),
    repositorio.obterProdutosAtencao(),
  ])

  return {
    cards,
    produtosAtencao,
    atualizadoEm: new Date().toISOString(),
  }
}
