import { readFile, readdir } from 'node:fs/promises'

export async function aplicarEstruturaDeTeste(cliente) {
  const arquivos = ['db/ci-bootstrap.sql', 'db/schema.sql',
    ...(await readdir('db/migrations')).filter((nome) => nome.endsWith('.sql')).sort().map((nome) => `db/migrations/${nome}`)]
  for (const arquivo of arquivos) {
    await cliente.query(await readFile(arquivo, 'utf8'))
  }
}
