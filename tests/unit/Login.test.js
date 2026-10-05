import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../src/contexts/AuthProvider.jsx'
import { ToastProvider } from '../../src/contexts/ToastProvider.jsx'
import { Login } from '../../src/pages/Login.jsx'

describe('Login', () => {
  it('mostra os campos de acesso, sem rodapé nem login social', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/login'] },
        createElement(ToastProvider, null, createElement(AuthProvider, null, createElement(Login))),
      ),
    )

    expect(html).not.toContain('© 2026 Bioma Pet Shop · NoStock')
    expect(html).toContain('E-mail')
    expect(html).toContain('Senha')
    expect(html).toContain('Entrar no Sistema')
    expect(html).toContain('Bem-vindo de volta')
    expect(html).toContain('Esqueci a senha')
    expect(html).toContain('Manter conectado por 30 dias')
    expect(html).not.toContain('Google')
    expect(html).not.toContain('Apple')
  })
})
