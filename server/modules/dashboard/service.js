import { obterEnv } from '../../config/env.js'
import { limitesDoDiaAtual } from '../../shared/horarioLoja.js'
import * as repositorio from './repository.js'

export async function obterResumo() {
  const { inicio, fim } = limitesDoDiaAtual(obterEnv().fusoHorario)

  const [cards, produtosAtencao] = await Promise.all([
    repositorio.obterCards({ inicioDoDia: inicio, fimDoDia: fim }),
    repositorio.obterProdutosAtencao(),
  ])

  return { cards, produtosAtencao }
}
