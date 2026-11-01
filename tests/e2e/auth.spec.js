import { test, expect } from './fixtures.js'

test('login inválido informa o erro e não cria sessão', async ({ page, dados }) => {
  await page.goto('/login')
  await page.getByLabel(/^E-mail(?:\s*\*)?$/).fill(dados.gestor.email)
  await page.getByLabel(/^Senha(?:\s*\*)?$/).fill('acesso-invalido')
  await page.getByRole('button', { name: 'Entrar no Sistema', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  expect((await page.request.get('/api/auth/me')).status()).toBe(401)
})

test('login e logout protegem as páginas e encerram a sessão', async ({ page, entrar }) => {
  await page.goto('/produtos')
  await expect(page).toHaveURL(/\/login$/)
  await entrar()
  await expect(page.getByRole('heading', { name: 'Estoque de Produtos' })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  expect((await page.request.get('/api/auth/me')).status()).toBe(401)
})

test('operador não acessa áreas gerenciais por URL nem pela API', async ({ page, entrar }) => {
  await entrar('operador')
  for (const rota of ['usuarios', 'relatorios', 'reposicao']) {
    await page.goto(`/${rota}`)
    await expect(page.getByText('Esta área é restrita a gestores.', { exact: true })).toBeVisible()
  }
  for (const rota of ['usuarios', 'reposicao']) {
    expect((await page.request.get(`/api/${rota}`)).status()).toBe(403)
  }
})

test('sessão encerrada exige novo login e permite retomar a tela', async ({ page, entrar, dados }) => {
  await entrar()
  await page.request.post('/api/auth/logout')
  await page.getByRole('tab', { name: 'Sem estoque', exact: true }).click()
  const dialogo = page.getByRole('dialog', { name: 'Sessão expirada' })
  await expect(dialogo).toBeVisible()
  await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
  await dialogo.getByLabel(/^E-mail(?:\s*\*)?$/).fill(dados.gestor.email)
  await dialogo.getByLabel(/^Senha(?:\s*\*)?$/).fill(dados.gestor.senha)
  await dialogo.getByRole('button', { name: 'Entrar no Sistema', exact: true }).click()
  await expect(dialogo).toHaveCount(0)
  await expect(page).toHaveURL(/\/produtos$/)
  await expect(page.getByRole('row').filter({ hasText: dados.produtos.zerado.nome })).toBeVisible()
})
