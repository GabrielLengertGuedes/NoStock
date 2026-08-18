import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Campo } from '../../src/components/Campo.jsx'

describe('Campo', () => {
  it('associa o rotulo ao controle', () => {
    const html = renderToStaticMarkup(createElement(Campo, { id: 'nome', rotulo: 'Nome' }))

    expect(html).toContain('for="nome"')
    expect(html).toContain('id="nome"')
  })

  it('liga a mensagem de erro ao controle', () => {
    const html = renderToStaticMarkup(
      createElement(Campo, { id: 'nome', rotulo: 'Nome', erro: 'Informe o nome' }),
    )

    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="nome-erro"')
    expect(html).toContain('id="nome-erro"')
    expect(html).toContain('Informe o nome')
  })
})
