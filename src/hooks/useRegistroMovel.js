import { useContext } from 'react'

import { RegistroMovelContext } from '../contexts/registro-movel-context.js'

export function useRegistroMovel() {
  const contexto = useContext(RegistroMovelContext)
  if (!contexto) {
    throw new Error('useRegistroMovel deve ser usado dentro de RegistroMovelProvider')
  }
  return contexto
}
