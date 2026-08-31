import { AppError } from '../../shared/AppError.js'
import * as servico from './service.js'

export async function registrar(req, res) {
  const { tipo, ...dados } = req.validado.body

  if (tipo === 'AJUSTE' && req.session.papel !== 'GESTOR') {
    throw new AppError('SEM_PERMISSAO', 'Acesso restrito a gestores.')
  }

  const movimentacao = await servico.registrar({
    ...dados,
    tipo,
    usuarioId: req.session.usuarioId,
  })

  res.status(201).json({ dados: movimentacao })
}
