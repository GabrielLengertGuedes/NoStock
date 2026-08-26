import { api } from './client.js'

export function obterSessao() {
  return api.get('/auth/me')
}

export function entrar(credenciais) {
  return api.post('/auth/login', credenciais)
}

export function sair() {
  return api.post('/auth/logout')
}
