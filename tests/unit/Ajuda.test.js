import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GRUPOS, conteudoParaPerfil, filtrarConteudo } from '../../src/pages/ajuda/conteudo.js'
import { Ajuda } from '../../src/pages/Ajuda.jsx'

const auth = vi.hoisted(() => ({ papel: 'GESTOR' }))

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    temPapel: (papel) => papel === auth.papel,
    usuario: { nome: 'Mariana Silva', papel: auth.papel },
    logout: vi.fn(),
  }),
}))

vi.mock('../../src/components/Notificacoes.jsx', () => ({ Notificacoes: () => null }))

function renderizar() {
  const queryClient = new QueryClient()
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, { initialEntries: ['/ajuda'] }, createElement(Ajuda)),
    ),
  )
}

const todasAsSecoes = GRUPOS.flatMap((grupo) => grupo.secoes)

describe('conteúdo da ajuda', () => {
  it('cada print citado existe em public/manual', () => {
    const arquivos = todasAsSecoes.flatMap((secao) => (secao.figuras ?? []).map((f) => f.arquivo))
    for (const arquivo of arquivos) {
      const caminho = fileURLToPath(new URL(`../../public/manual/${arquivo}`, import.meta.url))
      expect(existsSync(caminho), arquivo).toBe(true)
    }
  })

  it('as âncoras das seções não se repetem', () => {
    const ids = todasAsSecoes.map((secao) => secao.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('operador não vê seção, passo nem print de gestor', () => {
    const doOperador = conteudoParaPerfil(false).flatMap((grupo) => grupo.secoes)
    expect(doOperador.some((secao) => secao.perfil === 'GESTOR')).toBe(false)
    expect(doOperador.some((secao) => secao.passos.some((passo) => passo.gestor))).toBe(false)
    expect(doOperador.some((secao) => secao.figuras.some((figura) => figura.gestor))).toBe(false)
    expect(doOperador.find((secao) => secao.id === 'categorias').nota).toMatch(/gestor/)
  })

  it('gestor vê todas as seções', () => {
    const doGestor = conteudoParaPerfil(true).flatMap((grupo) => grupo.secoes)
    expect(doGestor).toHaveLength(todasAsSecoes.length)
  })

  it('a busca ignora acento e maiúscula', () => {
    const achados = filtrarConteudo(conteudoParaPerfil(true), 'REPOSICAO')
      .flatMap((grupo) => grupo.secoes)
      .map((secao) => secao.id)
    expect(achados).toContain('sugestao-de-compra')
    expect(filtrarConteudo(conteudoParaPerfil(true), 'xyzzy')).toEqual([])
  })
})

describe('Ajuda', () => {
  beforeEach(() => {
    auth.papel = 'GESTOR'
  })

  it('gestor vê as seções de gestão e o item no menu', () => {
    const html = renderizar()
    expect(html).toContain('Como usar')
    expect(html).toContain('href="/ajuda"')
    expect(html).toContain('id="sugestao-de-compra"')
    expect(html).toContain('Só gestor')
    // Antes de rolar, o índice marca a primeira seção como a que está sendo lida.
    expect(html).toContain('href="#perfis" aria-current="location"')
    expect(html.match(/aria-current="location"/g)).toHaveLength(1)
  })

  it('operador não vê as seções de gestão', () => {
    auth.papel = 'OPERADOR'
    const html = renderizar()
    expect(html).toContain('id="registrar-entrada"')
    expect(html).not.toContain('id="sugestao-de-compra"')
    expect(html).not.toContain('id="usuarios"')
    expect(html).not.toContain('Só gestor')
  })
})
