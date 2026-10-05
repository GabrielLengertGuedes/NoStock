import { useContext } from 'react'

import { ToastContext } from '../contexts/toast-context.js'

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return contexto
}
