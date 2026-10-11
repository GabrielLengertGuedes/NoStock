/** Ícones Bioma — Lucide 24×24 stroke 1.75, alinhados ao Figma. */

const propsBase = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

function Svg({ size = 18, className, children, ...rest }) {
  return (
    <svg width={size} height={size} className={className} {...propsBase} {...rest}>
      {children}
    </svg>
  )
}

export function IconeDashboard(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  )
}

export function IconeProdutos(props) {
  return (
    <Svg {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </Svg>
  )
}

export function IconeCategorias(props) {
  return (
    <Svg {...props}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </Svg>
  )
}

export function IconeFornecedores(props) {
  return (
    <Svg {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </Svg>
  )
}

/** Balão do WhatsApp: contorno no traço padrão, fone preenchido para ler em 18px. */
export function IconeWhatsapp(props) {
  return (
    <Svg {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9.2 7.6c-.5 0-1 .2-1.3.6-.5.6-.8 1.4-.6 2.3.3 1.3 1.1 2.6 2.3 3.8 1.2 1.2 2.6 2 3.9 2.3.9.2 1.7-.1 2.3-.6.4-.4.6-.8.6-1.3 0-.2-.1-.4-.3-.5l-1.6-.8c-.2-.1-.5-.1-.7.1l-.6.7c-.1.2-.4.2-.6.1-.7-.3-1.3-.8-1.8-1.3s-1-1.1-1.3-1.8c-.1-.2 0-.4.1-.6l.6-.6c.2-.2.2-.5.1-.7l-.8-1.6c-.1-.2-.3-.3-.5-.3z"
      />
    </Svg>
  )
}

export function IconeMovimentacoes(props) {
  return (
    <Svg {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </Svg>
  )
}

export function IconeUsuarios(props) {
  return (
    <Svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </Svg>
  )
}

export function IconeSino(props) {
  return (
    <Svg {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  )
}

export function IconeEngrenagem(props) {
  return (
    <Svg {...props}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Svg>
  )
}

export function IconeBusca(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  )
}

export function IconeOlho(props) {
  return (
    <Svg {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function IconeOlhoOff(props) {
  return (
    <Svg {...props}>
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.2 3.1" />
      <path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.4-1" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M2 2l20 20" />
    </Svg>
  )
}

export function IconePlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function IconeAlerta(props) {
  return (
    <Svg {...props}>
      <path d="m10.3 3.9-8.1 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.8-3.1l-8.1-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  )
}

export function IconeCheck(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Svg>
  )
}

export function IconeFechar(props) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  )
}

export function IconeCaixaVazia(props) {
  return (
    <Svg {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </Svg>
  )
}

export function IconeScan(props) {
  return (
    <Svg {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </Svg>
  )
}

export function IconeImagem(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 20" />
    </Svg>
  )
}

export function IconeBone(props) {
  return (
    <Svg {...props}>
      <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
    </Svg>
  )
}

export function IconeDroplet(props) {
  return (
    <Svg {...props}>
      <path d="M12 2.69 17.66 9A6 6 0 1 1 6.34 9Z" />
    </Svg>
  )
}

export function IconeToy(props) {
  return (
    <Svg {...props}>
      <path d="m2 12 9.5 3.5L15 6" />
      <path d="M13.5 15.5 22 12" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  )
}

export function IconeRelatorios(props) {
  return (
    <Svg {...props}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <rect x="7" y="13" width="3" height="5" rx="0.5" />
      <rect x="12" y="9" width="3" height="9" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </Svg>
  )
}

export function IconeReposicao(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.48 1.3h7.24a1.5 1.5 0 0 0 1.47-1.2L20 8H6" />
    </Svg>
  )
}

export function IconeCategoria({ categoria = '', ...props }) {
  const t = categoria.toLowerCase()
  if (/ração|racao|alimento|pet food|comida/.test(t)) return <IconeBone {...props} />
  if (/higiene|shampoo|limpeza|banho/.test(t)) return <IconeDroplet {...props} />
  if (/brinquedo|toy|bola/.test(t)) return <IconeToy {...props} />
  return <IconeProdutos {...props} />
}

/* Ícones da versão para celular (/m). */

export function IconeInicio(props) {
  return (
    <Svg {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </Svg>
  )
}

export function IconeVoltar(props) {
  return (
    <Svg {...props}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  )
}

export function IconeAvancar(props) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  )
}

export function IconeMenos(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  )
}

export function IconeSetaEntrada(props) {
  return (
    <Svg {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Svg>
  )
}

export function IconeSetaSaida(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </Svg>
  )
}

export function IconeTelefone(props) {
  return (
    <Svg {...props}>
      <path d="M5.5 4h3.2l1.8 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8l1.4-2.2 4.5 1.8v3.2a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3.5 6a2 2 0 0 1 2-2Z" />
    </Svg>
  )
}

export function IconeCompartilhar(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5v11" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18 11h-1" />
    </Svg>
  )
}

export function IconeAdicionarTela(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </Svg>
  )
}

export function IconeExterno(props) {
  return (
    <Svg {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </Svg>
  )
}
