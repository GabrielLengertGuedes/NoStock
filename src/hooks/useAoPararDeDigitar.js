import { useEffect, useRef } from 'react'

export const ATRASO_DA_BUSCA_MS = 300

// Chama `aplicar` so quando a digitacao para por `atrasoMs`. Na busca, e o que
// separa digitar de pesquisar: sem isso cada tecla virava uma ida a API.
// `cancelar` existe para o "limpar filtros" nao ser desfeito por uma busca
// que ainda estava agendada.
export function useAoPararDeDigitar(aplicar, atrasoMs = ATRASO_DA_BUSCA_MS) {
  const espera = useRef(null)

  useEffect(() => () => clearTimeout(espera.current), [])

  return {
    agendar(valor) {
      clearTimeout(espera.current)
      espera.current = setTimeout(() => aplicar(valor), atrasoMs)
    },
    cancelar() {
      clearTimeout(espera.current)
    },
  }
}
