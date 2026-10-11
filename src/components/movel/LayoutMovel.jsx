import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.js'
import { useRegistroMovel } from '../../hooks/useRegistroMovel.js'
import {
  IconeInicio,
  IconeMovimentacoes,
  IconePlus,
  IconeProdutos,
  IconeReposicao,
  IconeVoltar,
} from '../IconesBioma.jsx'

const ABAS = [
  { para: '/m', rotulo: 'Início', Icone: IconeInicio, fim: true },
  { para: '/m/estoque', rotulo: 'Estoque', Icone: IconeProdutos },
  { para: '/m/historico', rotulo: 'Histórico', Icone: IconeMovimentacoes },
  // Mesma regra do backend: sugestão de compra é só de gestor.
  { para: '/m/repor', rotulo: 'Repor', Icone: IconeReposicao, gestor: true },
]

function BarraMovel() {
  const { temPapel } = useAuth()
  const abas = ABAS.filter((aba) => !aba.gestor || temPapel('GESTOR'))

  return (
    <nav className="movel-barra" aria-label="Navegação principal">
      <div className="movel-trilho movel-barra-itens">
        {abas.map(({ para, rotulo, Icone, fim }) => (
          <NavLink key={para} to={para} end={fim} className="movel-aba">
            <span className="movel-aba-icone" aria-hidden="true">
              <Icone size={22} />
            </span>
            {rotulo}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/**
 * Casca das telas do celular. Tela de detalhe passa `rodape` com as próprias
 * ações, e ele toma o lugar da barra de navegação.
 */
export function LayoutMovel({
  sobretitulo,
  titulo,
  subtitulo,
  voltar,
  direita,
  rodape,
  comRegistrar = false,
  children,
}) {
  const { abrir } = useRegistroMovel()
  const navegar = useNavigate()
  const { key } = useLocation()

  // Aberta pela notificação, a tela é a primeira do histórico: voltar sairia do app.
  function irDeVolta() {
    if (key !== 'default') navegar(-1)
    else navegar(voltar.para, { replace: true })
  }

  const classes = ['movel']
  if (rodape) classes.push('movel-com-rodape')
  else if (comRegistrar) classes.push('movel-com-registrar')

  return (
    <div className={classes.join(' ')}>
      <header className="movel-topo">
        <div className="movel-trilho movel-topo-linha">
          <div className="movel-topo-texto">
            {voltar ? (
              <button type="button" className="movel-voltar" onClick={irDeVolta}>
                <IconeVoltar size={18} />
                {voltar.rotulo}
              </button>
            ) : null}
            {sobretitulo ? <p className="movel-sobretitulo">{sobretitulo}</p> : null}
            <h1 className="movel-titulo">{titulo}</h1>
            {subtitulo ? <p className="movel-subtitulo">{subtitulo}</p> : null}
          </div>
          {direita}
        </div>
      </header>

      <main className="movel-trilho movel-conteudo">{children}</main>

      {rodape ? (
        <div className="movel-rodape">
          <div className="movel-trilho movel-rodape-acoes">{rodape}</div>
        </div>
      ) : (
        <BarraMovel />
      )}

      {comRegistrar && !rodape ? (
        <button type="button" className="movel-registrar" onClick={() => abrir()}>
          <IconePlus size={20} />
          Registrar
        </button>
      ) : null}
    </div>
  )
}
