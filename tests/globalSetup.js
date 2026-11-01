import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

import { iniciarBancoTemporario } from '../scripts/tests/postgres.js'
import { aplicarEstruturaDeTeste } from '../scripts/tests/schema.js'

export default async function prepararTestes(projeto) {
  const banco = await iniciarBancoTemporario('nostock_test')
  const cliente = new pg.Client({ connectionString: banco.url, ssl: false })

  try {
    await cliente.connect()
    await cliente.query('begin')
    await aplicarEstruturaDeTeste(cliente)
    await cliente.query(await readFile('db/seed.sql', 'utf8'))
    await cliente.query('commit')
    projeto.provide('bancoTemporario', { url: banco.url, segredo: randomBytes(32).toString('hex') })
  } catch (erro) {
    await cliente.query('rollback').catch(() => {})
    await cliente.end()
    await banco.encerrar()
    throw erro
  }

  await cliente.end()
  console.log('Testes: PostgreSQL 17 temporário preparado; Supabase não será utilizado.')
  return async () => {
    await banco.encerrar()
    console.log('Testes: banco temporário encerrado e removido.')
  }
}
