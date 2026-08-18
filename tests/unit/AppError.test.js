import { describe, expect, it } from 'vitest'

import { AppError } from '../../server/shared/AppError.js'

describe('AppError', () => {
  it('deriva o status HTTP a partir do codigo', () => {
    expect(new AppError('NAO_AUTENTICADO', 'x').status).toBe(401)
    expect(new AppError('SEM_PERMISSAO', 'x').status).toBe(403)
    expect(new AppError('NAO_ENCONTRADO', 'x').status).toBe(404)
    expect(new AppError('CONFLITO', 'x').status).toBe(409)
    expect(new AppError('VALIDACAO', 'x').status).toBe(422)
    expect(new AppError('SALDO_INSUFICIENTE', 'x').status).toBe(400)
    expect(new AppError('MUITAS_TENTATIVAS', 'x').status).toBe(429)
  })

  it('trata codigo desconhecido como erro interno', () => {
    expect(new AppError('CODIGO_QUE_NAO_EXISTE', 'x').status).toBe(500)
  })

  it('guarda os campos quando recebe', () => {
    const erro = new AppError('VALIDACAO', 'Dados inválidos.', { nome: 'obrigatório' })
    expect(erro.campos).toEqual({ nome: 'obrigatório' })
    expect(new AppError('VALIDACAO', 'x').campos).toBeNull()
  })
})
