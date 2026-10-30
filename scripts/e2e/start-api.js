import { validarDestinoE2E } from './database.js'

process.env.DATABASE_URL = validarDestinoE2E(process.env.E2E_DATABASE_URL).href
process.env.DATABASE_CA_CERT = ''
process.env.NODE_ENV = 'test'
process.env.PORT = '3002'
process.env.CORS_ORIGIN = 'http://127.0.0.1:4175'
process.env.BCRYPT_ROUNDS = '4'
process.env.VAPID_PUBLIC_KEY = ''
process.env.VAPID_PRIVATE_KEY = ''
process.env.VAPID_SUBJECT = ''

await import('../../server/index.js')
