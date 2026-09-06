import { IconePlus } from './IconesBioma.jsx'

/**
 * FAB terra do Figma. Sem leitor de código — abre o fluxo de entrada.
 * @param {{ onClick: () => void, rotulo?: string }} props
 */
export function FabBioma({ onClick, rotulo = 'Registrar entrada' }) {
  return (
    <button type="button" className="fab-bioma" onClick={onClick} aria-label={rotulo} title={rotulo}>
      <IconePlus size={22} />
    </button>
  )
}
