import {
  IconeCategorias,
  IconeDashboard,
  IconeFornecedores,
  IconeMovimentacoes,
  IconeProdutos,
  IconeRelatorios,
  IconeReposicao,
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
  // Relatorios e reposicao expoem receita/compra: mesma regra de acesso do backend (GESTOR, RN10).
  if (temPapel('GESTOR')) {
    itens.push({ para: '/relatorios', rotulo: 'Relatórios', Icone: IconeRelatorios })
    itens.push({ para: '/reposicao', rotulo: 'Sugestão de compra', Icone: IconeReposicao })
    itens.push({ para: '/usuarios', rotulo: 'Usuários', Icone: IconeUsuarios })
  }
  return itens
}
