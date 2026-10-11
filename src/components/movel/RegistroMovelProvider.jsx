import { useCallback, useMemo, useState } from 'react'

import { RegistroMovelContext } from '../../contexts/registro-movel-context.js'
import { FolhaMovimentacao } from './FolhaMovimentacao.jsx'

// Uma folha só para todas as telas do celular: o botão Registrar da barra e
// os botões Entrada/Saída do produto abrem a mesma.
export function RegistroMovelProvider({ children }) {
  const [aberta, setAberta] = useState(null)
  const [vezes, setVezes] = useState(0)

  const abrir = useCallback(({ tipo = 'ENTRADA', produto = null } = {}) => {
    setVezes((atual) => atual + 1)
    setAberta({ tipo, produto })
  }, [])

  const valor = useMemo(() => ({ abrir }), [abrir])

  return (
    <RegistroMovelContext.Provider value={valor}>
      {children}
      {aberta ? (
        <FolhaMovimentacao
          key={vezes}
          tipoInicial={aberta.tipo}
          produtoInicial={aberta.produto}
          aoFechar={() => setAberta(null)}
        />
      ) : null}
    </RegistroMovelContext.Provider>
  )
}
