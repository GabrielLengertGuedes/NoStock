import { inject } from 'vitest'

import { ambienteDeTeste } from '../scripts/tests/ambiente.js'

// Configura antes de importar a aplicação: dotenv não sobrescreve esses valores.
// Sem o contexto do globalSetup, falha antes de carregar qualquer teste.
Object.assign(process.env, ambienteDeTeste(inject('bancoTemporario')))
