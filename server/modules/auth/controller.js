import * as servico from './service.js'

export async function login(req, res, next) {
  try {
    const { email, senha } = req.body
    const usuario = await servico.login(email, senha)
    
    // Configura a sessão com o ID e Papel
    req.session.usuarioId = usuario.id
    req.session.papel = usuario.papel
    
    res.status(200).json({ dados: usuario })
  } catch (erro) {
    next(erro)
  }
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('connect.sid') // Limpa o cookie pelo nome padrão
    res.status(204).send()
  })
}

export async function me(req, res, next) {
  try {
    const usuario = await servico.me(req.session.usuarioId)
    res.status(200).json({ dados: usuario })
  } catch (erro) {
    next(erro)
  }
}
