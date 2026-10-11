import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { IconeExterno } from '../../components/IconesBioma.jsx'
import { LayoutMovel } from '../../components/movel/LayoutMovel.jsx'
import { PassosInstalarIOS } from '../../components/movel/PassosInstalarIOS.jsx'
import { useAlertasPush } from '../../hooks/useAlertasPush.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'

const NIVEIS = [
  { valor: 'BAIXO', rotulo: 'ficar abaixo do mínimo, crítico ou acabar' },
  { valor: 'CRITICO', rotulo: 'ficar crítico ou acabar' },
  { valor: 'SEM_ESTOQUE', rotulo: 'acabar' },
]

const AVISOS = {
  carregando: 'Verificando este celular…',
  'sem-suporte':
    'Este navegador não recebe notificações. No Android, use o Chrome. No iPhone, é preciso o iOS 16.4 ou mais novo.',
  indisponivel: 'Os alertas ainda não foram configurados no servidor. Avise quem cuida do sistema.',
  bloqueado:
    'As notificações estão bloqueadas para este site. Libere nas configurações do navegador e volte aqui.',
}

function Alertas({ alertas }) {
  const toast = useToast()
  const [escolhido, setEscolhido] = useState('BAIXO')
  const ligado = alertas.estado === 'ligado'
  const nivel = alertas.nivel ?? escolhido

  async function escolher(valor) {
    setEscolhido(valor)
    if (ligado && (await alertas.mudarNivel(valor))) toast.mostrar({ titulo: 'Preferência salva' })
  }

  async function ativar() {
    if (await alertas.ativar(nivel)) toast.mostrar({ titulo: 'Alertas ligados neste celular' })
  }

  async function desligar() {
    if (await alertas.desativar()) toast.mostrar({ titulo: 'Alertas desligados neste celular' })
  }

  async function testar() {
    if (await alertas.testar()) {
      toast.mostrar({ titulo: 'Alerta de teste enviado', mensagem: 'Ele deve aparecer em alguns segundos.' })
    }
  }

  if (alertas.estado === 'instalar') {
    return (
      <div className="movel-cartao movel-alertas">
        <p>No iPhone, os alertas só chegam com o app na Tela de Início.</p>
        <PassosInstalarIOS />
      </div>
    )
  }

  if (AVISOS[alertas.estado]) {
    return <p className="movel-aviso">{AVISOS[alertas.estado]}</p>
  }

  return (
    <div className="movel-opcoes">
      <p className="movel-opcao">
        <span>
          {ligado ? 'Ligados neste celular' : 'Desligados neste celular'}
          <small>Chegam mesmo com o app fechado.</small>
        </span>
      </p>

      <fieldset className="movel-niveis" disabled={alertas.ocupado}>
        <legend>Avisar quando um produto</legend>
        {NIVEIS.map((opcao) => (
          <label key={opcao.valor} className="movel-radio">
            <input
              type="radio"
              name="nivel-alerta"
              value={opcao.valor}
              checked={nivel === opcao.valor}
              onChange={() => escolher(opcao.valor)}
            />
            {opcao.rotulo}
          </label>
        ))}
      </fieldset>

      {alertas.erro ? (
        <p className="movel-opcao movel-erro" role="alert">
          {alertas.erro}
        </p>
      ) : null}

      {ligado ? (
        <>
          <button type="button" className="movel-opcao movel-opcao-link" onClick={testar} disabled={alertas.ocupado}>
            Enviar alerta de teste
          </button>
          <button type="button" className="movel-opcao movel-opcao-perigo" onClick={desligar} disabled={alertas.ocupado}>
            Desligar alertas
          </button>
        </>
      ) : (
        <div className="movel-opcao">
          <button
            type="button"
            className="movel-botao movel-botao-primario movel-botao-bloco"
            onClick={ativar}
            disabled={alertas.ocupado}
          >
            {alertas.ocupado ? 'Ativando…' : 'Ativar alertas'}
          </button>
        </div>
      )}
    </div>
  )
}

export function ContaMovel() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  const alertas = useAlertasPush()
  const [saindo, setSaindo] = useState(false)
  const papel = usuario?.papel === 'GESTOR' ? 'Gerente da loja' : 'Operador'

  // Sair desliga os alertas deste aparelho: num celular da loja, quem entra
  // depois não deve receber os avisos de outra pessoa.
  async function sair() {
    setSaindo(true)
    if (alertas.estado === 'ligado') await alertas.desativar()
    await logout()
    navegar('/login', { replace: true, state: { from: { pathname: '/m' } } })
  }

  return (
    <LayoutMovel voltar={{ rotulo: 'Início', para: '/m' }} titulo="Sua conta">
      <div className="movel-perfil">
        <span className="movel-avatar movel-avatar-grande" aria-hidden="true">
          {usuario?.nome?.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div>
          <p className="movel-perfil-nome">{usuario?.nome}</p>
          <p className="movel-subtitulo">{papel}</p>
        </div>
      </div>

      <div className="movel-secao">
        <h2>Alertas de estoque</h2>
      </div>
      <Alertas alertas={alertas} />

      <div className="movel-opcoes">
        <Link to="/dashboard" className="movel-opcao movel-opcao-link">
          Abrir versão completa
          <IconeExterno size={16} />
        </Link>
        <button type="button" className="movel-opcao movel-opcao-perigo" onClick={sair} disabled={saindo}>
          <span>
            {saindo ? 'Saindo…' : 'Sair'}
            <small>Também desliga os alertas deste celular.</small>
          </span>
        </button>
      </div>
    </LayoutMovel>
  )
}
