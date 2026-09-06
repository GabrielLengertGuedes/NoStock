import {
  IconeCategorias,
  IconeDashboard,
  IconeFornecedores,
  IconeMovimentacoes,
  IconeProdutos,
  IconeUsuarios,
} from '../components/IconesBioma.jsx'
import { useAuth } from './useAuth.js'

export function useMenuPrincipal() {
  const { temPapel } = useAuth()

  const itens = [
    { para: '/dashboard', rotulo: 'Dashboard', Icone: IconeDashboard },
    { para: '/produtos', rotulo: 'Produtos', Icone: IconeProdutos },
    { para: '/categorias', rotulo: 'Categorias', Icone: IconeCategorias },
    { para: '/fornecedores', rotulo: 'Fornecedores', Icone: IconeFornecedores },
    { para: '/movimentacoes', rotulo: 'Movimentações', Icone: IconeMovimentacoes },
  ]
  if (temPapel('GESTOR')) {
    itens.push({ para: '/usuarios', rotulo: 'Usuários', Icone: IconeUsuarios })
  }
  return itens
}
