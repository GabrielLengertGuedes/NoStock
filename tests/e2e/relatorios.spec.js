import { test, expect, abrirAcao } from './fixtures.js'

test('venda entra na receita e descarte não infla os indicadores', async ({ page, entrar, dados }) => {
  await entrar()
  for (const motivo of ['VENDA', 'DESCARTE']) {
    await abrirAcao(page, dados.produtos.normal.nome, 'Registrar saída')
    const dialogo = page.getByRole('dialog')
    await dialogo.getByLabel(/^Motivo(?:\s*\*)?$/).selectOption(motivo)
    await dialogo.getByLabel(/^Quantidade(?:\s*\*)?$/).fill('2')
    await dialogo.getByRole('button', { name: 'Registrar', exact: true }).click()
    await expect(dialogo).toContainText('Movimentação registrada com sucesso.')
    await dialogo.getByRole('button', { name: 'Fechar', exact: true }).last().click()
  }
  await page.goto('/relatorios')
  const ranking = page.getByRole('region', { name: 'Ranking de produtos' })
  const produto = ranking.getByRole('row').filter({ hasText: dados.produtos.normal.nome })
  await expect(produto).toContainText('40,00')
  await expect(produto.getByRole('cell').nth(1)).toHaveText('2')
  await page.getByRole('tab', { name: 'Lista geral', exact: true }).click()
  await expect(produto).toContainText(dados.categoria.nome)
  await page.reload()
  await expect(ranking.getByRole('row').filter({ hasText: dados.produtos.normal.nome })).toContainText('40,00')
})

test('sem vendas no período exibe estado vazio explicativo', async ({ page, entrar }) => {
  await entrar('gestor', '/relatorios')
  await expect(page.getByText('Nenhuma venda no período', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Indicadores do período' })).toContainText('0,00')
})
