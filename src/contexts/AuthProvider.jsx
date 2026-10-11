import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { entrar as apiEntrar, obterSessao, sair as apiSair } from '../api/auth.js'
import { definirTratadorNaoAutenticado } from '../api/client.js'
import { AuthContext } from './auth-context.js'

const AVISO_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente para continuar.'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [avisoSessao, setAvisoSessao] = useState(null)
  const [loginExigido, setLoginExigido] = useState(false)
  // Saida voluntaria: o RotaProtegida manda para /login sem lembrar a pagina,
  // para o proximo a entrar no PC do balcao nao cair na tela de quem saiu.
  const [saiu, setSaiu] = useState(false)
  const usuarioRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    usuarioRef.current = usuario
  }, [usuario])

  useEffect(() => {
    let ativo = true

    obterSessao()
      .then((resposta) => {
        if (ativo) setUsuario(resposta.dados)
      })
      .catch(() => {
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    definirTratadorNaoAutenticado(() => {
      if (usuarioRef.current) {
        setAvisoSessao(AVISO_SESSAO_EXPIRADA)
        setLoginExigido(true)
      }
      setUsuario(null)
    })

    return () => definirTratadorNaoAutenticado(null)
  }, [])

  async function login(credenciais) {
    const resposta = await apiEntrar(credenciais)
    setUsuario(resposta.dados)
    setLoginExigido(false)
    setAvisoSessao(null)
    setSaiu(false)
    // Quem entra de novo depois da sessao expirar continua na mesma tela, e as
    // consultas dela tinham parado no 401: sem isto a pagina seguia mostrando
    // o erro (ou a lista vazia) ate a pessoa trocar de rota.
    queryClient.invalidateQueries()
    return resposta.dados
  }

  async function logout() {
    try {
      await apiSair()
    } catch {
      // sessão já pode ter caído; o importante é limpar o estado local
    }
    // No PC do balcao o proximo a entrar e outra pessoa: nada do cache de quem
    // saiu pode aparecer para ela.
    queryClient.clear()
    setSaiu(true)
    setUsuario(null)
    setLoginExigido(false)
    setAvisoSessao(null)
  }

  function limparAvisoSessao() {
    setAvisoSessao(null)
  }

  // O papel vale na API a cada request (lido do banco). Quando o gestor edita
  // a propria conta, o menu e as rotas precisam acompanhar sem novo login.
  async function recarregarSessao() {
    try {
      const resposta = await obterSessao()
      setUsuario(resposta.dados)
    } catch (erro) {
      // Timeout ou 500 nao dizem nada sobre a sessao: so o 401 tira a pessoa.
      if (erro?.status === 401) setUsuario(null)
    }
  }

  const valor = {
    usuario,
    carregando,
    avisoSessao,
    loginExigido,
    saiu,
    autenticado: Boolean(usuario),
    login,
    logout,
    limparAvisoSessao,
    recarregarSessao,
    temPapel: (papel) => usuario?.papel === papel,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
