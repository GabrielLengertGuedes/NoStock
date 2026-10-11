import { readFileSync } from 'node:fs'

import bcrypt from 'bcrypt'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { criarApp } from '../../server/app.js'
import { obterPool } from '../../server/db/pool.js'
import { avisarSePiorou } from '../../server/modules/notificacoes/service.js'
import { abrirTransacao, desfazerTransacao, temBanco } from '../helpers/banco.js'

// Nenhum alerta sai de verdade: o envio ao servico de push e simulado.
const webpush = vi.hoisted(() => ({ sendNotification: vi.fn() }))
vi.mock('web-push', () => ({ default: webpush }))

// A migracao roda dentro da transacao do teste. No banco do CI ela ja foi
// aplicada e nao muda nada; no de desenvolvimento, a tabela existe so ate o rollback.
const MIGRACAO = readFileSync(new URL('../../db/migrations/002-inscricoes-push.sql', import.meta.url), 'utf8')

const SENHA = 'Senha123'
const CHAVES = { p256dh: 'BChavePublicaDoAparelho', auth: 'segredo-auth' }
const endpoint = (nome) => `https://fcm.googleapis.com/fcm/send/${nome}`

describe.skipIf(!temBanco())('/api/notificacoes e os alertas de estoque', () => {
  let app
  let hashSenha
  let ids
  let produtoId

  beforeAll(async () => {
    hashSenha = await bcrypt.hash(SENHA, 4)
    vi.stubEnv('VAPID_PUBLIC_KEY', 'chave-publica-de-teste')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'chave-privada-de-teste')
    vi.stubEnv('VAPID_SUBJECT', 'mailto:loja@exemplo.com')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(async () => {
    webpush.sendNotification.mockReset()
    webpush.sendNotification.mockResolvedValue({ statusCode: 201 })

    await abrirTransacao()
    await obterPool().query(MIGRACAO)
    app = criarApp()

    const { rows: usuarios } = await obterPool().query(
      `insert into public.usuarios (nome, email, senha_hash, papel, ativo)
       values ('Marina Gestora', 'push.gestora@exemplo.com', $1, 'GESTOR', true),
              ('Paulo Gestor', 'push.gestor2@exemplo.com', $1, 'GESTOR', true),
              ('Carla Operadora', 'push.operadora@exemplo.com', $1, 'OPERADOR', true),
              ('Ex Gestor', 'push.inativo@exemplo.com', $1, 'GESTOR', false)
       returning id, email`,
      [hashSenha],
    )
    ids = Object.fromEntries(usuarios.map((u) => [u.email.split('@')[0].replace('push.', ''), u.id]))

    const { rows: categorias } = await obterPool().query(
      `insert into public.categorias (nome) values ('[teste] Push') returning id`,
    )
    const { rows: fornecedores } = await obterPool().query(
      `insert into public.fornecedores (nome, telefone) values ('Litoral Pet Teste', '47998124410') returning id`,
    )
    const { rows: produtos } = await obterPool().query(
      `insert into public.produtos (nome, categoria_id, fornecedor_id, preco_venda, quantidade_atual, estoque_minimo)
       values ('Ração Push 15kg', $1, $2, 10.00, 7, 6)
       returning id`,
      [categorias[0].id, fornecedores[0].id],
    )
    produtoId = produtos[0].id
  })

  afterEach(desfazerTransacao)

  const logar = async (apelido) => {
    const cliente = request.agent(app)
    await cliente.post('/api/auth/login').send({ email: `push.${apelido}@exemplo.com`, senha: SENHA })
    return cliente
  }

  const inscrever = (usuarioId, nome, nivel = 'BAIXO') =>
    obterPool().query(
      `insert into public.inscricoes_push (usuario_id, endpoint, p256dh, auth, nivel)
       values ($1, $2, $3, $4, $5)`,
      [usuarioId, endpoint(nome), CHAVES.p256dh, CHAVES.auth, nivel],
    )

  const enviadosPara = () => webpush.sendNotification.mock.calls.map(([inscricao]) => inscricao.endpoint)
  const alertaEnviado = (indice = 0) => JSON.parse(webpush.sendNotification.mock.calls[indice][1])

  describe('inscrição do aparelho', () => {
    it('exige sessão', async () => {
      const resposta = await request(app).get('/api/notificacoes/chave-publica')

      expect(resposta.status).toBe(401)
    })

    it('entrega a chave pública configurada', async () => {
      const cliente = await logar('operadora')
      const resposta = await cliente.get('/api/notificacoes/chave-publica')

      expect(resposta.status).toBe(200)
      expect(resposta.body.dados).toEqual({ chavePublica: 'chave-publica-de-teste' })
    })

    it('inscreve o aparelho e lista só os do próprio usuário', async () => {
      await inscrever(ids.gestor2, 'de-outra-pessoa')
      const cliente = await logar('gestora')

      const salvar = await cliente
        .put('/api/notificacoes/inscricoes')
        .send({ endpoint: endpoint('celular-marina'), chaves: CHAVES, nivel: 'CRITICO' })
      const lista = await cliente.get('/api/notificacoes/inscricoes')

      expect(salvar.status).toBe(200)
      expect(salvar.body.dados).toMatchObject({ endpoint: endpoint('celular-marina'), nivel: 'CRITICO' })
      expect(lista.body.dados.map((i) => i.endpoint)).toEqual([endpoint('celular-marina')])
    })

    it('o mesmo aparelho com outro usuário troca de dono em vez de duplicar', async () => {
      const marina = await logar('gestora')
      const carla = await logar('operadora')

      await marina.put('/api/notificacoes/inscricoes').send({ endpoint: endpoint('celular-da-loja'), chaves: CHAVES })
      await carla.put('/api/notificacoes/inscricoes').send({ endpoint: endpoint('celular-da-loja'), chaves: CHAVES })

      const { rows } = await obterPool().query(
        `select usuario_id, nivel from public.inscricoes_push where endpoint = $1`,
        [endpoint('celular-da-loja')],
      )
      expect(rows).toEqual([{ usuario_id: ids.operadora, nivel: 'BAIXO' }])
    })

    it('recusa endereço fora dos serviços de push dos navegadores', async () => {
      const cliente = await logar('gestora')

      const outroSite = await cliente
        .put('/api/notificacoes/inscricoes')
        .send({ endpoint: 'https://exemplo.com/receber', chaves: CHAVES })
      const semHttps = await cliente
        .put('/api/notificacoes/inscricoes')
        .send({ endpoint: 'http://fcm.googleapis.com/fcm/send/x', chaves: CHAVES })

      expect(outroSite.status).toBe(422)
      expect(outroSite.body.erro.campos.endpoint).toBe('Endereço de notificação não reconhecido')
      expect(semHttps.status).toBe(422)
    })

    it('cada um só desinscreve o próprio aparelho', async () => {
      await inscrever(ids.gestora, 'celular-marina')
      const carla = await logar('operadora')
      const marina = await logar('gestora')

      const alheia = await carla.delete('/api/notificacoes/inscricoes').send({ endpoint: endpoint('celular-marina') })
      const { rows: depoisDaAlheia } = await obterPool().query(`select 1 from public.inscricoes_push where endpoint = $1`, [
        endpoint('celular-marina'),
      ])
      const propria = await marina.delete('/api/notificacoes/inscricoes').send({ endpoint: endpoint('celular-marina') })
      const { rows: depoisDaPropria } = await obterPool().query(`select 1 from public.inscricoes_push where endpoint = $1`, [
        endpoint('celular-marina'),
      ])

      expect(alheia.status).toBe(204)
      expect(depoisDaAlheia).toHaveLength(1)
      expect(propria.status).toBe(204)
      expect(depoisDaPropria).toHaveLength(0)
    })

    it('o alerta de teste vai só para o aparelho pedido', async () => {
      await inscrever(ids.gestora, 'celular-marina')
      await inscrever(ids.gestora, 'tablet-marina')
      const marina = await logar('gestora')

      const resposta = await marina.post('/api/notificacoes/teste').send({ endpoint: endpoint('celular-marina') })
      const naoInscrito = await marina.post('/api/notificacoes/teste').send({ endpoint: endpoint('desconhecido') })

      expect(resposta.status).toBe(204)
      expect(enviadosPara()).toEqual([endpoint('celular-marina')])
      expect(alertaEnviado().titulo).toBe('Alertas ligados')
      expect(naoInscrito.status).toBe(404)
    })
  })

  describe('alerta quando o estoque piora', () => {
    it('a saída que deixa o produto baixo avisa quem pediu, menos quem registrou', async () => {
      await inscrever(ids.gestora, 'celular-marina', 'BAIXO')
      await inscrever(ids.gestor2, 'celular-paulo', 'SEM_ESTOQUE')
      await inscrever(ids.operadora, 'celular-carla', 'BAIXO')
      await inscrever(ids.inativo, 'celular-antigo', 'BAIXO')
      const carla = await logar('operadora')

      const saida = await carla
        .post('/api/movimentacoes')
        .send({ produtoId, tipo: 'SAIDA', motivo: 'VENDA', quantidade: 2 })

      expect(saida.status).toBe(201)
      await vi.waitFor(() => expect(webpush.sendNotification).toHaveBeenCalled())
      expect(enviadosPara()).toEqual([endpoint('celular-marina')])
      expect(alertaEnviado()).toEqual({
        titulo: 'Estoque baixo: Ração Push 15kg',
        corpo: 'Restam 5 un (mínimo 6). Venda de 2 un por Carla. Fornecedor: Litoral Pet Teste.',
        url: `/m/produtos/${produtoId}`,
        tag: `produto-${produtoId}`,
      })
      expect(webpush.sendNotification.mock.calls[0][2]).toMatchObject({ topic: `produto-${produtoId}` })
    })

    it('zerar o produto avisa também quem só quer saber quando acaba', async () => {
      await inscrever(ids.gestora, 'celular-marina', 'BAIXO')
      await inscrever(ids.gestor2, 'celular-paulo', 'SEM_ESTOQUE')
      const carla = await logar('operadora')

      await carla.post('/api/movimentacoes').send({ produtoId, tipo: 'SAIDA', motivo: 'VENDA', quantidade: 7 })

      await vi.waitFor(() => expect(webpush.sendNotification).toHaveBeenCalledTimes(2))
      expect(enviadosPara().sort()).toEqual([endpoint('celular-marina'), endpoint('celular-paulo')])
      expect(alertaEnviado().titulo).toBe('Acabou: Ração Push 15kg')
    })

    it('não avisa quando o nível não piora', async () => {
      await inscrever(ids.gestora, 'celular-marina', 'BAIXO')
      const base = { produtoId, tipo: 'SAIDA', motivo: 'VENDA', quantidade: 1, usuario: { id: ids.operadora, nome: 'Carla' } }

      await avisarSePiorou({ ...base, saldoAnterior: 20, saldoPosterior: 19, estoqueMinimo: 6 })
      await avisarSePiorou({ ...base, saldoAnterior: 3, saldoPosterior: 2, estoqueMinimo: 6 })
      await avisarSePiorou({ ...base, tipo: 'ENTRADA', motivo: 'COMPRA', saldoAnterior: 2, saldoPosterior: 26, estoqueMinimo: 6 })

      expect(webpush.sendNotification).not.toHaveBeenCalled()
    })

    it('apaga a inscrição que o serviço de push deu como expirada', async () => {
      await inscrever(ids.gestora, 'celular-desinstalado', 'BAIXO')
      webpush.sendNotification.mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))

      await avisarSePiorou({
        produtoId,
        tipo: 'SAIDA',
        motivo: 'VENDA',
        quantidade: 2,
        saldoAnterior: 7,
        saldoPosterior: 5,
        estoqueMinimo: 6,
        usuario: { id: ids.operadora, nome: 'Carla' },
      })

      const { rows } = await obterPool().query(`select 1 from public.inscricoes_push where endpoint = $1`, [
        endpoint('celular-desinstalado'),
      ])
      expect(rows).toHaveLength(0)
    })
  })
})
