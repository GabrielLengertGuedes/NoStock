import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { IconeAlerta, IconeCheck, IconeFechar } from '../components/IconesBioma.jsx'
import { ToastContext } from './toast-context.js'

const DURACAO_MS = 5000

// Avisos rápidos no canto da tela (sucesso ou erro), que somem sozinhos.
// Ficam fora das páginas para sobreviver à troca de rota — ex.: o "bem-vindo"
// disparado no login aparece já no dashboard.
export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const proximoId = useRef(0)
  const temporizadores = useRef(new Map())

  const fechar = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id))
    temporizadores.current.delete(id)
    setAvisos((lista) => lista.filter((aviso) => aviso.id !== id))
  }, [])

  const mostrar = useCallback(
    ({ tipo = 'sucesso', titulo, mensagem }) => {
      proximoId.current += 1
      const id = proximoId.current
      setAvisos((lista) => [...lista, { id, tipo, titulo, mensagem }])
      temporizadores.current.set(
        id,
        setTimeout(() => fechar(id), DURACAO_MS),
      )
      return id
    },
    [fechar],
  )

  useEffect(() => {
    const pendentes = temporizadores.current
    return () => pendentes.forEach((temporizador) => clearTimeout(temporizador))
  }, [])

  const valor = useMemo(() => ({ mostrar, fechar }), [mostrar, fechar])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`toast toast-${aviso.tipo}`}>
            <span className="toast-icone" aria-hidden="true">
              {aviso.tipo === 'erro' ? <IconeAlerta size={18} /> : <IconeCheck size={18} />}
            </span>
            <div className="toast-texto">
              <p className="toast-titulo">{aviso.titulo}</p>
              {aviso.mensagem ? <p className="toast-mensagem">{aviso.mensagem}</p> : null}
            </div>
            <button
              type="button"
              className="toast-fechar"
              aria-label="Fechar aviso"
              onClick={() => fechar(aviso.id)}
            >
              <IconeFechar size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
