import pg from 'pg'

import { aplicarEstruturaDeTeste } from '../tests/schema.js'

export function validarDestinoE2E(valor) {
  let url
  try {
    url = new URL(valor)
  } catch {
    throw new Error('E2E: conexão exclusiva não informada ou inválida')
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.pathname !== '/nostock_e2e' || url.search || url.hash) {
    throw new Error('E2E: somente PostgreSQL local na base nostock_e2e é permitido')
  }
  return url
}

export async function conectarBancoE2E() {
  const url = validarDestinoE2E(process.env.E2E_DATABASE_URL)
  const cliente = new pg.Client({ connectionString: url.href, ssl: false })
  await cliente.connect()
  const { rows } = await cliente.query('select current_database() as nome')
  if (rows[0].nome !== 'nostock_e2e') {
    await cliente.end()
    throw new Error('E2E: base inesperada')
  }
  return cliente
}

export async function prepararBancoE2E() {
  const cliente = await conectarBancoE2E()
  try {
    const { rows } = await cliente.query("select count(*)::int as total from information_schema.tables where table_schema = 'public'")
    if (rows[0].total !== 0) throw new Error('E2E: a preparação exige uma base vazia')
    await cliente.query('begin')
    await aplicarEstruturaDeTeste(cliente)
    await cliente.query('create schema e2e_meta; create table e2e_meta.identificacao (id boolean primary key check (id)); insert into e2e_meta.identificacao values (true)')
    await cliente.query('commit')
  } catch (erro) {
    await cliente.query('rollback').catch(() => {})
    throw erro
  } finally {
    await cliente.end()
  }
}

export async function restaurarBancoE2E() {
  const cliente = await conectarBancoE2E()
  try {
    const marca = await cliente.query('select id from e2e_meta.identificacao')
    if (marca.rows.length !== 1 || marca.rows[0].id !== true) throw new Error('E2E: base não identificada')
    await cliente.query('truncate public.inscricoes_push, public.session, public.movimentacoes, public.produtos, public.fornecedores, public.categorias, public.usuarios restart identity')
  } finally {
    await cliente.end()
  }
}
