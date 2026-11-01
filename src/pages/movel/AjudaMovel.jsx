import '../../styles/ajuda.css'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { IconeExterno } from '../../components/IconesBioma.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { conteudoParaPerfil } from '../ajuda/conteudo.js'
import { SecaoAjuda } from '../ajuda/SecaoAjuda.jsx'

/** Só o que se faz pelo celular e as dúvidas; o resto fica no manual completo (/ajuda). */
export function AjudaMovel() {
  const { temPapel } = useAuth()
  const ehGestor = temPapel('GESTOR')
  const grupos = useMemo(() => conteudoParaPerfil(ehGestor).filter((grupo) => grupo.celular), [ehGestor])

  return (
    <LayoutMovel voltar={{ rotulo: 'Sua conta', para: '/m/conta' }} titulo="Como usar">
      {grupos.map((grupo) => (
        <section key={grupo.id} className="ajuda-movel-grupo" aria-labelledby={`grupo-${grupo.id}`}>
          <div className="movel-secao">
            <h2 id={`grupo-${grupo.id}`}>{grupo.titulo}</h2>
          </div>
          <div className="movel-opcoes">
            {grupo.secoes.map((secao) => (
              <details key={secao.id} id={secao.id} className="ajuda-movel-item">
                <summary className="movel-opcao">{secao.titulo}</summary>
                <div className="ajuda-movel-corpo">
                  <SecaoAjuda secao={secao} ehGestor={ehGestor} comTitulo={false} />
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="movel-opcoes">
        <Link to="/ajuda" className="movel-opcao movel-opcao-link">
          <span>
            Manual completo
            <small>Produtos, cadastros, relatórios e equipe, na versão completa.</small>
          </span>
          <IconeExterno size={16} />
        </Link>
      </div>
    </LayoutMovel>
  )
}
