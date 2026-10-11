# Imagem de producao: a API Express serve tambem o front compilado, numa porta so.
# As variaveis (DATABASE_URL, SESSION_SECRET...) entram pelo painel, em runtime.
# A DATABASE_URL tem que ser a do pooler do Supabase (aws-0-...pooler.supabase.com):
# o host direto db.<ref>.supabase.co so tem IPv6, e o container nao sai por IPv6.
# DATABASE_CA_CERT (opcional, recomendada): o conteudo do .crt da CA do Supabase,
# colado no painel numa linha so, com \n no lugar das quebras. Com ela a API
# valida o certificado do banco; sem ela so cifra e avisa no log ao subir.

# ---- build do front ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- imagem final: API + dist ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
