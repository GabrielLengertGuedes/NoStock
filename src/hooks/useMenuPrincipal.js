import { useAuth } from './useAuth.js'

export function useMenuPrincipal() {
  const { temPapel } = useAuth()

  const itens = [{ para: '/categorias', rotulo: 'Categorias' }]
  if (temPapel('GESTOR')) {
    itens.push({ para: '/usuarios', rotulo: 'Usuários' })
  }
  return itens
}
