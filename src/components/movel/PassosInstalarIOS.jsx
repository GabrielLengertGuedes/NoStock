import { IconeAdicionarTela, IconeCompartilhar } from '../IconesBioma.jsx'

// No iPhone o Safari só oferece notificação para o app instalado na Tela de Início (iOS 16.4+).
export function PassosInstalarIOS() {
  return (
    <ol className="movel-passos">
      <li>
        <span>
          Toque em <IconeCompartilhar size={16} /> Compartilhar, na barra do Safari.
        </span>
      </li>
      <li>
        <span>
          Escolha <IconeAdicionarTela size={16} /> Adicionar à Tela de Início.
        </span>
      </li>
      <li>
        <span>Abra o Bioma Estoque pelo ícone e ative os alertas.</span>
      </li>
    </ol>
  )
}
