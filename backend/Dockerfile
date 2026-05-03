# ── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Prisma query engine requires OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/ ./prisma/

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
