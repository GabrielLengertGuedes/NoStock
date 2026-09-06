import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { BadgeStatus } from '../../src/components/BadgeStatus.jsx'

function marcacao(status) {
  return renderToStaticMarkup(createElement(BadgeStatus, { status }))
}

describe('BadgeStatus', () => {
  it('mostra rótulo textual para cada estado', () => {
    expect(marcacao('NORMAL')).toContain('OK')
    expect(marcacao('BAIXO')).toContain('ATENÇÃO')
    expect(marcacao('CRITICO')).toContain('CRÍTICO')
    expect(marcacao('SEM_ESTOQUE')).toContain('SEM ESTOQUE')
  })

  it('distingue SEM_ESTOQUE de CRITICO também pela classe visual', () => {
    expect(marcacao('SEM_ESTOQUE')).toContain('badge-status-sem-estoque')
    expect(marcacao('CRITICO')).toContain('badge-status-critico')
  })

  it('não quebra com status desconhecido', () => {
    expect(marcacao('INVENTADO')).toContain('INVENTADO')
    expect(marcacao(undefined)).toContain('—')
  })
})
