import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import * as apiUsuarios from '../../src/api/usuarios.js'
import { AuthProvider } from '../../src/contexts/AuthProvider.jsx'
import { Usuarios } from '../../src/pages/Usuarios.jsx'

vi.mock('../../src/api/usuarios.js', async () => {
  const atual = await vi.importActual('../../src/api/usuarios.js')
  return {
    ...atual,
    useUsuarios: () => ({
      data: [
        {
          id: 1,
          nome: 'Maria Gestora',
          email: 'maria@exemplo.com',
          papel: 'GESTOR',
          ativo: true,
        },
      ],
      isPending: false,
      isError: false,
      error: null,
    }),
    useCriarUsuario: () => ({ isPending: false, error: null, reset: () => {}, mutateAsync: vi.fn() }),
    useAtualizarUsuario: () => ({
      isPending: false,
      error: null,
      reset: () => {},
      mutateAsync: vi.fn(),
    }),
    useInativarUsuario: () => ({ isPending: false, error: null, mutateAsync: vi.fn() }),
    useReativarUsuario: () => ({ isPending: false, error: null, mutate: vi.fn() }),
    useRedefinirSenhaUsuario: () => ({
      isPending: false,
      error: null,
      reset: () => {},
      mutateAsync: vi.fn(),
    }),
  }
})

vi.mock('../../src/api/auth.js', () => ({
  obterSessao: () =>
    Promise.resolve({
      dados: { id: 1, nome: 'Maria Gestora', email: 'maria@exemplo.com', papel: 'GESTOR' },
    }),
  entrar: vi.fn(),
  sair: vi.fn(),
}))

describe('Usuarios', () => {
  it('lista usuarios e oferece o cadastro novo', () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: cliente },
        createElement(
          MemoryRouter,
          { initialEntries: ['/usuarios'] },
          createElement(AuthProvider, null, createElement(Usuarios)),
        ),
      ),
    )

    expect(html).toContain('Usuários')
    expect(html).toContain('Novo usuário')
    expect(html).toContain('Maria Gestora')
    expect(html).toContain('maria@exemplo.com')
    expect(apiUsuarios.useUsuarios).toBeTypeOf('function')
  })
})
