import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ErroApi } from '../api/client.js'
import { IconeAlerta, IconeOlho, IconeOlhoOff } from '../components/IconesBioma.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { validarLogin } from '../lib/validarLogin.js'

// Cada falha do POST /auth/login vira um aviso que diz o que fazer a seguir.
function avisoDeFalha(falha) {
  if (!(falha instanceof ErroApi)) {
    return { titulo: 'Não foi possível entrar', mensagem: 'Tente de novo em instantes.' }
  }
  switch (falha.codigo) {
    case 'NAO_AUTENTICADO':
      return { titulo: 'E-mail ou senha incorretos', mensagem: 'Confira os dados e tente de novo.' }
    case 'MUITAS_TENTATIVAS':
      return { titulo: 'Acesso bloqueado por alguns minutos', mensagem: falha.mensagem }
    case 'SEM_RESPOSTA':
      return { titulo: 'Sem conexão com o servidor', mensagem: falha.mensagem }
    default:
      return { titulo: 'Não foi possível entrar', mensagem: falha.mensagem }
  }
}

export function Login({ modo = 'pagina' }) {
  const { autenticado, login, avisoSessao, limparAvisoSessao, loginExigido } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const destino = localizacao.state?.from?.pathname || '/dashboard'
  const campoEmail = useRef(null)
  const campoSenha = useRef(null)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [falha, setFalha] = useState(null)
  const [errosCampo, setErrosCampo] = useState({})
  const [credenciaisInvalidas, setCredenciaisInvalidas] = useState(false)
  const [avisoLocal, setAvisoLocal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterConectado, setManterConectado] = useState(false)

  if (autenticado && modo === 'pagina' && !loginExigido) {
    return <Navigate to={destino} replace />
  }

  function limparErro(campo) {
    setErrosCampo((atual) => ({ ...atual, [campo]: undefined }))
    setCredenciaisInvalidas(false)
    setFalha(null)
  }

  async function enviar(evento) {
    evento.preventDefault()
    setFalha(null)
    setAvisoLocal(null)
    setCredenciaisInvalidas(false)
    limparAvisoSessao()

    const errosLocais = validarLogin({ email, senha })
    setErrosCampo(errosLocais)
    if (errosLocais.email || errosLocais.senha) {
      ;(errosLocais.email ? campoEmail : campoSenha).current?.focus()
      return
    }

    setEnviando(true)
    try {
      const usuario = await login({ email: email.trim(), senha })
      const primeiroNome = usuario?.nome?.trim().split(' ')[0]
      toast.mostrar({
        titulo: modo === 'bloqueio' ? 'Sessão retomada' : 'Login realizado',
        mensagem: primeiroNome ? `Bem-vindo de volta, ${primeiroNome}!` : 'Bem-vindo de volta!',
      })
      if (modo === 'pagina') navegar(destino, { replace: true })
    } catch (erro) {
      if (erro instanceof ErroApi && erro.campos) {
        setErrosCampo(erro.campos)
        ;(erro.campos.email ? campoEmail : campoSenha).current?.focus()
      } else {
        setFalha(avisoDeFalha(erro))
        if (erro instanceof ErroApi && erro.codigo === 'NAO_AUTENTICADO') {
          setCredenciaisInvalidas(true)
          campoSenha.current?.select()
        }
      }
    } finally {
      setEnviando(false)
    }
  }

  function lembrarEsqueciSenha(evento) {
    evento.preventDefault()
    setFalha(null)
    setAvisoLocal('Para redefinir a senha, peça a um gestor na tela de Usuários.')
  }

  const emailInvalido = Boolean(errosCampo.email) || credenciaisInvalidas
  const senhaInvalida = Boolean(errosCampo.senha) || credenciaisInvalidas

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

      {falha ? (
        <div className="login-aviso" role="alert">
          <IconeAlerta size={18} />
          <div>
            <p className="login-aviso-titulo">{falha.titulo}</p>
            {falha.mensagem ? <p>{falha.mensagem}</p> : null}
          </div>
        </div>
      ) : avisoSessao ? (
        <p className="login-aviso text-body-sm" role="alert">
          {avisoSessao}
        </p>
      ) : avisoLocal ? (
        <p className="login-aviso login-aviso-info text-body-sm" role="status">
          {avisoLocal}
        </p>
      ) : null}

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
              ref={campoEmail}
              className="input-field login-input"
              type="email"
              autoComplete="username"
              placeholder="nome@bioma.com.br"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                limparErro('email')
              }}
              aria-invalid={emailInvalido || undefined}
              aria-describedby={errosCampo.email ? 'email-erro' : undefined}
              required
            />
          </div>
          {errosCampo.email ? (
            <p id="email-erro" className="login-campo-erro">
              {errosCampo.email}
            </p>
          ) : null}
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
              ref={campoSenha}
              className="input-field login-input login-input-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                limparErro('senha')
              }}
              aria-invalid={senhaInvalida || undefined}
              aria-describedby={errosCampo.senha ? 'senha-erro' : undefined}
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
          {errosCampo.senha ? (
            <p id="senha-erro" className="login-campo-erro">
              {errosCampo.senha}
            </p>
          ) : null}
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

        <button
          type="submit"
          className={`btn btn-primary login-submit${enviando ? ' btn-carregando' : ''}`}
          disabled={enviando}
        >
          <span>{enviando ? 'Entrando…' : 'Entrar no Sistema'}</span>
          {!enviando && (
            <img src="/brand/icon-arrow.svg" alt="" width={16} height={16} aria-hidden="true" />
          )}
        </button>
      </form>
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
              src="/brand/login-hero.webp"
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
      </div>
    </div>
  )
}
