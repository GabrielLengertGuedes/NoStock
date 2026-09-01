import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { Dashboard } from '../../src/pages/Dashboard.jsx'

vi.mock('../../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    autenticado: true,
    temPapel: () => true,
    usuario: { nome: 'Gestor' },
    logout: vi.fn(),
  }),
}))

describe('Dashboard', () => {
  it('oferece atalhos de entrada e saída', () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: cliente },
        createElement(MemoryRouter, { initialEntries: ['/dashboard'] }, createElement(Dashboard)),
      ),
    )

    expect(html).toContain('Dashboard')
    expect(html).toContain('Registrar entrada')
    expect(html).toContain('Registrar saída')
  })
})
