import { test, expect, abrirAcao, obterProduto } from './fixtures.js'

for (const [tipo, motivo, quantidade, saldo] of [
  ['entrada', 'COMPRA', 8, 10], ['entrada', 'DEVOLUCAO', 2, 4],
  ['saída', 'VENDA', 1, 1], ['saída', 'DESCARTE', 2, 0],
]) {
  test(`${tipo} por ${motivo} persiste saldo e identifica o responsável`, async ({ page, entrar, dados }) => {
    await entrar('operador')
    await abrirAcao(page, dados.produtos.critico.nome, `Registrar ${tipo}`)
    const dialogo = page.getByRole('dialog')
    await dialogo.getByLabel(/^Motivo(?:\s*\*)?$/).selectOption(motivo)
    await dialogo.getByLabel(/^Quantidade(?:\s*\*)?$/).fill(String(quantidade))
    await dialogo.getByRole('button', { name: 'Registrar', exact: true }).click()
    await expect(dialogo).toContainText('Movimentação registrada com sucesso.')
    await expect(dialogo).toContainText(`2 → ${saldo}`)
    await dialogo.getByRole('button', { name: 'Fechar', exact: true }).last().click()
    await page.reload()
    expect((await obterProduto(page, dados.produtos.critico.id)).quantidadeAtual).toBe(saldo)
    await page.goto('/movimentacoes')
    const linhas = page.getByRole('row').filter({ hasText: dados.produtos.critico.nome })
    await expect(linhas.first()).toContainText(dados.operador.nome)
    await expect(linhas).toHaveCount(2)
  })
}

test('saldo insuficiente não grava saída nem altera estoque', async ({ page, entrar, dados }) => {
  await entrar()
  await abrirAcao(page, dados.produtos.critico.nome, 'Registrar saída')
  const dialogo = page.getByRole('dialog')
  await dialogo.getByLabel(/^Quantidade(?:\s*\*)?$/).fill('3')
  await dialogo.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(dialogo.getByRole('alert')).toContainText(/saldo|disponível/i)
  expect((await obterProduto(page, dados.produtos.critico.id)).quantidadeAtual).toBe(2)
  const historico = await page.request.get(`/api/movimentacoes?produtoId=${dados.produtos.critico.id}`)
  expect((await historico.json()).meta.total).toBe(1)
})

test('filtro de histórico separa tipo e mantém responsável', async ({ page, entrar, dados }) => {
  await entrar('operador', '/movimentacoes')
  await expect(page.getByRole('row').filter({ hasText: 'Estoque inicial' })).toHaveCount(2)
  await expect(page.getByLabel(/^Funcionário(?:\s*\*)?$/)).toHaveCount(0)
  await page.getByRole('tab', { name: 'Saída', exact: true }).click()
  await expect(page.getByText('Nenhuma movimentação encontrada', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Entrada', exact: true }).click()
  await expect(page.getByRole('row').filter({ hasText: dados.produtos.critico.nome })).toContainText(dados.gestor.nome)
})
