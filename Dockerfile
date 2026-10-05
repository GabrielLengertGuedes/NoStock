# Imagem de producao: a API Express serve tambem o front compilado, numa porta so.
# As variaveis (DATABASE_URL, SESSION_SECRET...) entram pelo painel, em runtime.
# A DATABASE_URL tem que ser a do pooler do Supabase (aws-0-...pooler.supabase.com):
# o host direto db.<ref>.supabase.co so tem IPv6, e o container nao sai por IPv6.

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
