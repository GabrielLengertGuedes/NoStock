import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { BadgeStatus } from '../../src/components/BadgeStatus.jsx'

const marcacao = (status) => renderToStaticMarkup(createElement(BadgeStatus, { status }))

describe('BadgeStatus', () => {
  it('mostra rotulo em texto, nunca so a cor', () => {
    expect(marcacao('NORMAL')).toContain('Normal')
    expect(marcacao('BAIXO')).toContain('Baixo')
    expect(marcacao('CRITICO')).toContain('Crítico')
    expect(marcacao('SEM_ESTOQUE')).toContain('Sem estoque')
  })

  it('distingue SEM_ESTOQUE de CRITICO', () => {
    expect(marcacao('SEM_ESTOQUE')).not.toEqual(marcacao('CRITICO'))
    expect(marcacao('SEM_ESTOQUE')).toContain('badge-status-sem-estoque')
    expect(marcacao('CRITICO')).toContain('badge-status-critico')
  })

  it('nao quebra com status desconhecido', () => {
    expect(marcacao('INVENTADO')).toContain('INVENTADO')
    expect(marcacao(undefined)).toContain('—')
  })
})
