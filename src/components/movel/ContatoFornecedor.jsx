import { linkWhatsapp } from '../../lib/telefone.js'
import { IconeTelefone, IconeWhatsapp } from '../IconesBioma.jsx'

/**
 * Atalhos para falar com o fornecedor: WhatsApp e ligação, ou o e-mail quando
 * não há telefone. Abre só a conversa; o pedido em si fica com quem compra.
 */
export function ContatoFornecedor({ fornecedor, comRotulo = false }) {
  const whatsapp = linkWhatsapp(fornecedor.telefone)

  if (!fornecedor.telefone && !fornecedor.email) return null

  return (
    <div className={`movel-contato${comRotulo ? ' movel-contato-largo' : ''}`}>
      {whatsapp ? (
        <a
          className={`movel-botao movel-botao-whatsapp${comRotulo ? '' : ' movel-botao-icone'}`}
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Conversar com ${fornecedor.nome} no WhatsApp`}
        >
          <IconeWhatsapp size={20} />
          {comRotulo ? 'Chamar no WhatsApp' : null}
        </a>
      ) : null}
      {fornecedor.telefone ? (
        <a
          className="movel-botao movel-botao-secundario movel-botao-icone"
          href={`tel:${fornecedor.telefone}`}
          aria-label={`Ligar para ${fornecedor.nome}`}
        >
          <IconeTelefone size={20} />
        </a>
      ) : (
        <a className="movel-botao movel-botao-secundario" href={`mailto:${fornecedor.email}`}>
          Enviar e-mail
        </a>
      )}
    </div>
  )
}
