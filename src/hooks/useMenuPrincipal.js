import { useAuth } from './useAuth.js'

export function useMenuPrincipal() {
  const { temPapel } = useAuth()

  const itens = [
    { para: '/dashboard', rotulo: 'Dashboard' },
    { para: '/produtos', rotulo: 'Produtos' },
    { para: '/movimentacoes', rotulo: 'Movimentações' },
    { para: '/categorias', rotulo: 'Categorias' },
    { para: '/fornecedores', rotulo: 'Fornecedores' },
  ]
  if (temPapel('GESTOR')) {
    itens.push({ para: '/usuarios', rotulo: 'Usuários' })
  }
  return itens
}
