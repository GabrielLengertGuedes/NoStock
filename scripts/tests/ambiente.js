export function ambienteDeTeste(contexto) {
  let url
  try {
    url = new URL(contexto?.url)
  } catch {
    throw new Error('Banco temporário não configurado. Execute com vitest.config.js.')
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.pathname !== '/nostock_test' || url.search || url.hash
    || !contexto.segredo) {
    throw new Error('Os testes exigem banco temporário local nostock_test.')
  }

  return {
    DATABASE_URL: url.href,
    DATABASE_CA_CERT: '',
    SESSION_SECRET: contexto.segredo,
    SESSION_MAX_AGE_HOURS: '8',
    NODE_ENV: 'test',
    PORT: '3001',
    BCRYPT_ROUNDS: '12',
    CORS_ORIGIN: 'http://localhost:5173',
    FUSO_HORARIO: 'America/Sao_Paulo',
    VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
    VAPID_SUBJECT: '',
  }
}
