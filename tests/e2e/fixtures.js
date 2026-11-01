import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'
import { test as base, expect } from '@playwright/test'

import { conectarBancoE2E, restaurarBancoE2E } from '../../scripts/e2e/database.js'

export const test = base.extend({
  dados: async ({ context }, executarTeste) => {
    await context.clearCookies()
    await restaurarBancoE2E()
    const cliente = await conectarBancoE2E()
    let dados
    try {
      const senha = randomBytes(16).toString('hex')
      const sufixo = randomBytes(8).toString('hex')
      const hash = await bcrypt.hash(senha, 4)
      const { rows: usuarios } = await cliente.query(
        `insert into public.usuarios (nome,email,senha_hash,papel) values
        ('Gestor E2E',$2,$1,'GESTOR'),
        ('Operador E2E',$3,$1,'OPERADOR') returning id,nome,email,papel`,
        [hash, `gestor-${sufixo}@example.com`, `operador-${sufixo}@example.com`],
      )
      const { rows: [categoria] } = await cliente.query("insert into public.categorias (nome) values ('Ração E2E') returning id,nome")
      const { rows: [fornecedor] } = await cliente.query("insert into public.fornecedores (nome,email) values ('Fornecedor E2E','compras@example.com') returning id,nome")
      const produtos = []
      for (const [nome, saldo, minimo, vinculo] of [
        ['Ração crítica E2E', 2, 10, fornecedor.id],
        ['Areia em dia E2E', 20, 5, fornecedor.id],
        ['Bola zerada E2E', 0, 3, null],
      ]) {
        const { rows: [produto] } = await cliente.query(`insert into public.produtos
          (nome,categoria_id,fornecedor_id,preco_venda,quantidade_atual,estoque_minimo)
          values ($1,$2,$3,20,$4,$5) returning id,nome`, [nome, categoria.id, vinculo, saldo, minimo])
        if (saldo > 0) await cliente.query(`insert into public.movimentacoes
          (produto_id,usuario_id,tipo,motivo,quantidade,saldo_anterior,saldo_posterior,preco_unitario)
          values ($1,$2,'ENTRADA','ESTOQUE_INICIAL',$3,0,$3,20)`, [produto.id, usuarios[0].id, saldo])
        produtos.push(produto)
      }
      dados = { gestor: { ...usuarios[0], senha }, operador: { ...usuarios[1], senha }, categoria, fornecedor,
        produtos: { critico: produtos[0], normal: produtos[1], zerado: produtos[2] } }
    } finally {
      await cliente.end()
    }
    await executarTeste(dados)
  },
  entrar: async ({ page, dados }, executarTeste) => {
    await executarTeste(async (papel = 'gestor', destino = '/produtos') => {
      await page.goto('/login')
      await page.getByLabel(/^E-mail(?:\s*\*)?$/).fill(dados[papel].email)
      await page.getByLabel(/^Senha(?:\s*\*)?$/).fill(dados[papel].senha)
      await page.getByRole('button', { name: 'Entrar no Sistema', exact: true }).click()
      await expect(page).not.toHaveURL(/\/login$/)
      await page.goto(destino)
      await expect(page.getByRole('main')).toBeVisible()
    })
  },
  semErrosDeRenderizacao: [async ({ page }, executarTeste) => {
    const erros = []
    page.on('pageerror', (erro) => erros.push(erro.message))
    await executarTeste()
    expect(erros).toEqual([])
  }, { auto: true }],
})

export { expect }

export async function abrirAcao(page, nome, acao) {
  await page.getByRole('button', { name: `Ações de ${nome}`, exact: true }).click()
  await page.getByRole('menuitem', { name: acao, exact: true }).click()
}

export async function obterProduto(page, id) {
  const resposta = await page.request.get(`/api/produtos/${id}`)
  expect(resposta.ok()).toBe(true)
  return (await resposta.json()).dados
}
