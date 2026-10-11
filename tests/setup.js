import 'dotenv/config'

process.env.SESSION_SECRET ??= 'segredo-de-teste'

// Teste nunca manda alerta push de verdade: o banco de desenvolvimento e
// compartilhado e pode ter celulares da equipe inscritos. Vazio conta como
// ausente, e o dotenv nao sobrescreve variavel que ja existe.
process.env.VAPID_PUBLIC_KEY = ''
process.env.VAPID_PRIVATE_KEY = ''
process.env.VAPID_SUBJECT = ''
