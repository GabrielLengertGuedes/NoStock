import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../src/contexts/AuthProvider.jsx'
import { Login } from '../../src/pages/Login.jsx'

describe('Login', () => {
  it('mostra o rodape 2026 e os campos de acesso', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/login'] },
        createElement(AuthProvider, null, createElement(Login)),
      ),
    )

    expect(html).toContain('© 2026 Bioma Pet Shop · NoStock')
    expect(html).toContain('E-mail')
    expect(html).toContain('Senha')
    expect(html).toContain('Entrar')
  })
})
