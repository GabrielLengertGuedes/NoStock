import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ErroApi } from '../api/client.js'
import { IconeOlho, IconeOlhoOff } from '../components/IconesBioma.jsx'
import { useAuth } from '../hooks/useAuth.js'

export function Login({ modo = 'pagina' }) {
  const { autenticado, login, avisoSessao, limparAvisoSessao, loginExigido } = useAuth()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const destino = localizacao.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [avisoLocal, setAvisoLocal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterConectado, setManterConectado] = useState(false)

  if (autenticado && modo === 'pagina' && !loginExigido) {
    return <Navigate to={destino} replace />
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro(null)
    setAvisoLocal(null)
    limparAvisoSessao()
    setEnviando(true)

    try {
      await login({ email, senha })
      if (modo === 'pagina') navegar(destino, { replace: true })
    } catch (falha) {
      const mensagem =
        falha instanceof ErroApi
          ? falha.mensagem
          : 'Não foi possível entrar. Tente de novo.'
      setErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  function lembrarEsqueciSenha(evento) {
    evento.preventDefault()
    setAvisoLocal('Para redefinir a senha, peça a um gestor na tela de Usuários.')
  }

  function ssoIndisponivel(evento) {
    evento.preventDefault()
    setAvisoLocal('Login com Google ou Apple não faz parte deste MVP. Use e-mail e senha.')
  }

  const formulario = (
    <>
      <header className="login-cabecalho">
        <div className="login-marca">
          <span className="login-marca-icone" aria-hidden="true">
            <img src="/brand/logo-paw.svg" alt="" width={20} height={20} />
          </span>
          <span className="login-marca-nome">Bioma PetShop</span>
        </div>
        <h1 className="login-titulo">Bem-vindo de volta</h1>
        <p className="login-subtitulo">
          Acesse sua conta para gerenciar seu estoque e clientes.
        </p>
      </header>

      {(avisoSessao || erro || avisoLocal) && (
        <p className={`login-aviso text-body-sm${avisoLocal && !erro ? ' login-aviso-info' : ''}`} role="alert">
          {erro || avisoLocal || avisoSessao}
        </p>
      )}

      <form className="login-formulario" onSubmit={enviar} noValidate>
        <div className="login-campo">
          <label className="login-label" htmlFor="email">
            E-mail
          </label>
          <div className="login-input-wrap">
            <img
              className="login-input-icone"
              src="/brand/icon-mail.svg"
              alt=""
              width={18}
              height={16}
              aria-hidden="true"
            />
            <input
              id="email"
              className="input-field login-input"
              type="email"
              autoComplete="username"
              placeholder="nome@bioma.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="login-campo">
          <div className="login-label-linha">
            <label className="login-label" htmlFor="senha">
              Senha
            </label>
            <a className="login-esqueci" href="#esqueci-senha" onClick={lembrarEsqueciSenha}>
              Esqueci a senha
            </a>
          </div>
          <div className="login-input-wrap">
            <img
              className="login-input-icone"
              src="/brand/icon-lock.svg"
              alt=""
              width={16}
              height={20}
              aria-hidden="true"
            />
            <input
              id="senha"
              className="input-field login-input login-input-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-olho"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <IconeOlhoOff size={18} /> : <IconeOlho size={18} />}
            </button>
          </div>
        </div>

        <label className="login-check">
          <input
            type="checkbox"
            checked={manterConectado}
            onChange={(e) => setManterConectado(e.target.checked)}
          />
          <span>Manter conectado por 30 dias</span>
        </label>
        {manterConectado && (
          <p className="login-check-nota text-body-sm">
            A sessão do sistema dura 8 horas por política de segurança. O gestor pode renovar o
            acesso ao entrar de novo.
          </p>
        )}

        <button type="submit" className="btn btn-primary login-submit" disabled={enviando}>
          <span>{enviando ? 'Entrando…' : 'Entrar no Sistema'}</span>
          {!enviando && (
            <img src="/brand/icon-arrow.svg" alt="" width={16} height={16} aria-hidden="true" />
          )}
        </button>
      </form>

      <div className="login-divisor" aria-hidden="true">
        <span>ou continue com</span>
      </div>

      <div className="login-sso">
        <button type="button" className="btn btn-secondary login-sso-btn" onClick={ssoIndisponivel}>
          <img src="/brand/icon-google.svg" alt="" width={18} height={18} aria-hidden="true" />
          Google
        </button>
        <button type="button" className="btn btn-secondary login-sso-btn" onClick={ssoIndisponivel}>
          <img src="/brand/icon-apple.svg" alt="" width={18} height={18} aria-hidden="true" />
          Apple
        </button>
      </div>
    </>
  )

  if (modo === 'bloqueio') {
    return (
      <div className="login-overlay">
        <div className="login login-bloqueio">
          <div className="login-cartao">{formulario}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login-shell">
        <div className="login-painel">
          <section className="login-hero" aria-label="Bioma PetShop">
            <img
              className="login-hero-foto"
              src="/brand/login-hero.png"
              alt="Cachorro e gato da Bioma PetShop"
            />
            <div className="login-hero-conteudo">
              <p className="login-hero-badge">
                <img src="/brand/icon-leaf.svg" alt="" width={12} height={12} aria-hidden="true" />
                Gestão sustentável
              </p>
              <h2 className="login-hero-titulo">
                Cuidado que floresce, <em>tecnologia</em> que simplifica.
              </h2>
              <p className="login-hero-texto">
                O hub central para o seu negócio pet. Gerencie estoque com o Bioma PetShop.
              </p>
            </div>
            <div className="login-hero-prova">
              <div className="login-avatares" aria-hidden="true">
                <img src="/brand/avatar-1.jpg" alt="" width={36} height={36} />
                <img src="/brand/avatar-2.jpg" alt="" width={36} height={36} />
                <img src="/brand/avatar-3.png" alt="" width={36} height={36} />
              </div>
              <p>+2.5k pets cuidados hoje</p>
            </div>
          </section>

          <section className="login-form-painel">{formulario}</section>
        </div>

        <footer className="login-rodape-links">
          <nav className="login-rodape-nav" aria-label="Institucional">
            <button type="button" className="login-rodape-link" onClick={() => setAvisoLocal('Termos de uso estarão disponíveis na versão publicada.')}>
              Termos
            </button>
            <button type="button" className="login-rodape-link" onClick={() => setAvisoLocal('A política de privacidade estará disponível na versão publicada.')}>
              Privacidade
            </button>
            <button type="button" className="login-rodape-link" onClick={() => setAvisoLocal('Para suporte, fale com um gestor da loja.')}>
              Suporte
            </button>
          </nav>
          <p>© 2026 Bioma Pet Shop · NoStock</p>
        </footer>
      </div>
    </div>
  )
}
