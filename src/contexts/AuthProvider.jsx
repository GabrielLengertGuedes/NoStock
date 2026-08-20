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
  const usuarioRef = useRef(null)

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
    return resposta.dados
  }

  async function logout() {
    try {
      await apiSair()
    } catch {
      // sessão já pode ter caído; o importante é limpar o estado local
    }
    setUsuario(null)
    setLoginExigido(false)
    setAvisoSessao(null)
  }

  function limparAvisoSessao() {
    setAvisoSessao(null)
  }

  const valor = {
    usuario,
    carregando,
    avisoSessao,
    loginExigido,
    autenticado: Boolean(usuario),
    login,
    logout,
    limparAvisoSessao,
    temPapel: (papel) => usuario?.papel === papel,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
