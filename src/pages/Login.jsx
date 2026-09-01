import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ErroApi } from '../api/client.js'
import { Campo } from '../components/Campo.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function Login({ modo = 'pagina' }) {
  const { autenticado, login, avisoSessao, limparAvisoSessao, loginExigido } = useAuth()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const destino = localizacao.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (autenticado && modo === 'pagina' && !loginExigido) {
    return <Navigate to={destino} replace />
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro(null)
    limparAvisoSessao()
    setEnviando(true)

    try {
      await login({ email, senha })
      if (modo === 'pagina') navegar(destino, { replace: true })
    } catch (falha) {
      // Mantém e-mail e senha digitados (CA1.2 / RN12).
      const mensagem =
        falha instanceof ErroApi
          ? falha.mensagem
          : 'Não foi possível entrar. Tente de novo.'
      setErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  const conteudo = (
    <div className={`login ${modo === 'bloqueio' ? 'login-bloqueio' : ''}`}>
      <div className="login-cartao card">
        <header className="login-cabecalho">
          <p className="text-micro" style={{ color: 'var(--primary-medium)' }}>
            Bioma Pet Shop
          </p>
          <h1 className="text-h2">NoStock</h1>
          <p className="text-body-sm" style={{ color: 'var(--slate)' }}>
            Entre com seu e-mail e senha para continuar.
          </p>
        </header>

        {(avisoSessao || erro) && (
          <p className="login-aviso text-body-sm" role="alert">
            {erro || avisoSessao}
          </p>
        )}

        <form className="login-formulario" onSubmit={enviar} noValidate>
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            obrigatorio
          />
          <Campo
            id="senha"
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            obrigatorio
          />

          <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <footer className="login-rodape text-caption">
          © 2026 Bioma Pet Shop · NoStock
        </footer>
      </div>
    </div>
  )

  if (modo === 'bloqueio') {
    return <div className="login-overlay">{conteudo}</div>
  }

  return conteudo
}
