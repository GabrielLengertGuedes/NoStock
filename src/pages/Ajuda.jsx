import '../styles/ajuda.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { EstadoVazio } from '../components/EstadoVazio.jsx'
import { Layout } from '../components/Layout.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMenuPrincipal } from '../hooks/useMenuPrincipal.js'
import { conteudoParaPerfil, filtrarConteudo } from './ajuda/conteudo.js'
import { SecaoAjuda } from './ajuda/SecaoAjuda.jsx'

/**
 * Seção que está sendo lida: a última cujo topo já passou logo abaixo da
 * topbar. No fim da página fica a última, mesmo curta demais para chegar lá.
 */
function useSecaoAtiva(ids) {
  const [ativa, setAtiva] = useState(ids[0] ?? null)

  useEffect(() => {
    if (ids.length === 0) return undefined
    const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')) || 69
    const linha = topbar + 32
    let quadro = 0

    function medir() {
      quadro = 0
      const elementos = ids.map((id) => document.getElementById(id)).filter(Boolean)
      if (elementos.length === 0) return
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let atual = elementos[0]
      if (noFim) atual = elementos[elementos.length - 1]
      else {
        for (const elemento of elementos) {
          if (elemento.getBoundingClientRect().top - linha > 0) break
          atual = elemento
        }
      }
      setAtiva(atual.id)
    }

    function aoRolar() {
      if (!quadro) quadro = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [ids])

  return ativa
}

export function Ajuda() {
  const menu = useMenuPrincipal()
  const { temPapel } = useAuth()
  const { hash } = useLocation()
  const [busca, setBusca] = useState('')
  const ehGestor = temPapel('GESTOR')

  const conteudo = useMemo(() => conteudoParaPerfil(ehGestor), [ehGestor])
  const visiveis = useMemo(() => filtrarConteudo(conteudo, busca), [conteudo, busca])
  const ids = useMemo(() => visiveis.flatMap((grupo) => grupo.secoes.map((secao) => secao.id)), [visiveis])
  const ativa = useSecaoAtiva(ids)
  const indice = useRef(null)

  // Índice mais alto que a tela rola por dentro: mantém o item ativo à vista.
  // Só mexe no próprio índice, nunca na página (no layout estreito ele não rola).
  useEffect(() => {
    const caixa = indice.current
    const item = caixa?.querySelector('[aria-current="location"]')
    if (!item || caixa.scrollHeight <= caixa.clientHeight) return
    const folga = 48
    if (item.offsetTop - folga < caixa.scrollTop) caixa.scrollTop = item.offsetTop - folga
    else if (item.offsetTop + item.offsetHeight + folga > caixa.scrollTop + caixa.clientHeight) {
      caixa.scrollTop = item.offsetTop + item.offsetHeight + folga - caixa.clientHeight
    }
  }, [ativa])

  // Link direto para uma seção (/ajuda#registrar-entrada): o router não rola sozinho.
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash])

  return (
    <Layout
      titulo="Como usar"
      subtitulo="Passo a passo das telas do NoStock, no computador e no celular."
      menu={menu}
      busca={busca}
      aoMudarBusca={setBusca}
      buscaPlaceholder="Buscar na ajuda…"
    >
      {visiveis.length === 0 ? (
        <EstadoVazio
          titulo="Nada encontrado na ajuda"
          descricao={`Nenhum assunto fala de "${busca.trim()}". Tente outra palavra.`}
          acao={
            <button type="button" className="btn btn-secondary" onClick={() => setBusca('')}>
              Limpar busca
            </button>
          }
        />
      ) : (
        <div className="ajuda-grade">
          <nav ref={indice} className="ajuda-indice" aria-label="Assuntos da ajuda">
            {visiveis.map((grupo) => (
              <div key={grupo.id} className="ajuda-indice-grupo">
                <p className="ajuda-rotulo">{grupo.titulo}</p>
                <ul>
                  {grupo.secoes.map((secao) => (
                    <li key={secao.id}>
                      <a
                        href={`#${secao.id}`}
                        aria-current={secao.id === ativa ? 'location' : undefined}
                      >
                        {secao.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="ajuda-conteudo">
            {visiveis.map((grupo) => (
              <section key={grupo.id} className="ajuda-grupo" aria-labelledby={`grupo-${grupo.id}`}>
                <h2 id={`grupo-${grupo.id}`} className="ajuda-grupo-titulo">
                  {grupo.titulo}
                </h2>
                {grupo.secoes.map((secao) => (
                  <article key={secao.id} id={secao.id} className="painel ajuda-secao">
                    <SecaoAjuda secao={secao} ehGestor={ehGestor} />
                  </article>
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
