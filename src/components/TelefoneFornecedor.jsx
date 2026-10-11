import { formatarTelefone, linkWhatsapp } from '../lib/telefone.js'
import { IconeWhatsapp } from './IconesBioma.jsx'

/** Telefone clicável e, ao lado, o atalho que abre a conversa no WhatsApp. */
export function TelefoneFornecedor({ nome, telefone }) {
  const whatsapp = linkWhatsapp(telefone)

  return (
    <span className="contato-telefone">
      <a href={`tel:${telefone}`}>{formatarTelefone(telefone)}</a>
      {whatsapp ? (
        <a
          className="link-whatsapp"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Conversar com ${nome} no WhatsApp`}
          title="Conversar no WhatsApp"
        >
          <IconeWhatsapp />
        </a>
      ) : null}
    </span>
  )
}
