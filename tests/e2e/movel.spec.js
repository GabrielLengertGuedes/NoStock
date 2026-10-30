import { test, expect, obterProduto } from './fixtures.js'

test('celular consulta produto e registra entrada com saldo persistente', async ({ page, entrar, dados }) => {
  await entrar('operador', '/m/estoque')
  await page.getByRole('searchbox', { name: 'Buscar produto pelo nome' }).fill('Ração')
  await page.getByRole('link').filter({ hasText: dados.produtos.critico.nome }).click()
  await expect(page.getByRole('heading', { name: dados.produtos.critico.nome })).toBeVisible()
  await page.getByRole('button', { name: 'Entrada', exact: true }).click()
  const dialogo = page.getByRole('dialog')
  await dialogo.getByLabel(/^Quantidade(?:\s*\*)?$/).fill('8')
  await dialogo.getByRole('button', { name: 'Registrar entrada de 8 un', exact: true }).click()
  await expect(dialogo.getByRole('heading', { name: 'Entrada registrada', exact: true })).toBeVisible()
  await dialogo.getByRole('button', { name: 'Concluir', exact: true }).click()
  await page.reload()
  expect((await obterProduto(page, dados.produtos.critico.id)).quantidadeAtual).toBe(10)
  await page.goto('/m/historico')
  await expect(page.getByRole('link').filter({ hasText: dados.produtos.critico.nome }).first()).toContainText('Operador')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('celular impede saída maior que saldo antes do envio', async ({ page, entrar, dados }) => {
  await entrar('operador', `/m/produtos/${dados.produtos.critico.id}`)
  await page.getByRole('button', { name: 'Saída', exact: true }).click()
  await page.getByRole('dialog').getByLabel(/^Quantidade(?:\s*\*)?$/).fill('3')
  await expect(page.getByText('Saldo insuficiente: há 2 un.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Registrar saída de 3 un', exact: true })).toBeDisabled()
  expect((await obterProduto(page, dados.produtos.critico.id)).quantidadeAtual).toBe(2)
})

test('celular oferece reposição somente ao gestor', async ({ page, entrar, dados }) => {
  await entrar('gestor', '/m/repor')
  await expect(page.getByRole('link', { name: 'Repor', exact: true })).toBeVisible()
  await expect(page.getByText(dados.produtos.critico.nome, { exact: true })).toBeVisible()
  await page.goto('/m/conta')
  await page.getByRole('button', { name: /Sair/ }).click()
  await entrar('operador', '/m/repor')
  await expect(page.getByText('Área do gestor', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Repor', exact: true })).toHaveCount(0)
})
