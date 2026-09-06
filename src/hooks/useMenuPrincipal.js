import { ICONES_NAV } from '../components/IconesBioma.jsx'
import { useAuth } from './useAuth.js'

export function useMenuPrincipal() {
  const { temPapel } = useAuth()

  const itens = [
    { para: '/dashboard', rotulo: 'Dashboard', Icone: ICONES_NAV['/dashboard'] },
    { para: '/produtos', rotulo: 'Produtos', Icone: ICONES_NAV['/produtos'] },
    { para: '/categorias', rotulo: 'Categorias', Icone: ICONES_NAV['/categorias'] },
    { para: '/fornecedores', rotulo: 'Fornecedores', Icone: ICONES_NAV['/fornecedores'] },
    { para: '/movimentacoes', rotulo: 'Movimentações', Icone: ICONES_NAV['/movimentacoes'] },
  ]
  if (temPapel('GESTOR')) {
    itens.push({ para: '/usuarios', rotulo: 'Usuários', Icone: ICONES_NAV['/usuarios'] })
  }
  return itens
}
