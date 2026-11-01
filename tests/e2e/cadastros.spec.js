import { test, expect, abrirAcao } from './fixtures.js'

for (const [rota, singular, plural, novo] of [
  ['categorias', 'categoria', 'Categorias', 'Nova categoria'],
  ['fornecedores', 'fornecedor', 'Fornecedores', 'Novo fornecedor'],
]) {
  test(`${plural}: gestor cria, edita, inativa e reativa cadastro`, async ({ page, entrar }) => {
    await entrar('gestor', `/${rota}`)
    await page.getByRole('button', { name: novo, exact: true }).click()
    let dialogo = page.getByRole('dialog')
    await dialogo.getByLabel(/^Nome(?:\s*\*)?$/).fill(`Cadastro ${singular} E2E`)
    if (rota === 'fornecedores') await dialogo.getByLabel(/^E-mail(?:\s*\*)?$/).fill('contato@example.com')
    await dialogo.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(dialogo).toHaveCount(0)
    await abrirAcao(page, `Cadastro ${singular} E2E`, 'Editar')
    dialogo = page.getByRole('dialog')
    await dialogo.getByLabel(/^Nome(?:\s*\*)?$/).fill(`Editado ${singular} E2E`)
    await dialogo.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(dialogo).toHaveCount(0)
    await abrirAcao(page, `Editado ${singular} E2E`, 'Inativar')
    await page.getByRole('dialog').getByRole('button', { name: 'Inativar', exact: true }).click()
    const inativos = page.getByRole('region', { name: `${plural} ${rota === 'categorias' ? 'inativas' : 'inativos'}`, exact: true })
    await expect(inativos).toContainText(`Editado ${singular} E2E`)
    await inativos.getByRole('button', { name: 'Reativar', exact: true }).click()
    await page.reload()
    await expect(page.getByRole('button', { name: `Ações de Editado ${singular} E2E`, exact: true })).toBeVisible()
  })

  test(`${plural}: vínculo com produto ativo impede inativação`, async ({ page, entrar, dados }) => {
    await entrar('gestor', `/${rota}`)
    await abrirAcao(page, dados[singular].nome, 'Inativar')
    await page.getByRole('dialog').getByRole('button', { name: 'Inativar', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(/produtos ativos/i)
  })

  test(`${plural}: operador consulta sem ações de gestão`, async ({ page, entrar, dados }) => {
    await entrar('operador', `/${rota}`)
    await expect(page.getByRole('heading', { name: dados[singular].nome, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: novo, exact: true })).toHaveCount(0)
    expect((await page.request.post(`/api/${rota}`, { data: { nome: 'Não autorizado', email: 'exemplo@example.com' } })).status()).toBe(403)
  })
}
