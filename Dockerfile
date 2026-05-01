# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install app dependencies (pnpm)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# OpenSSL is required by Prisma on Alpine (musl libc)
RUN apk add --no-cache openssl

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# The postinstall script runs `prisma generate --schema src/prisma/schema.prisma`
# so the schema must exist before `pnpm install`
COPY src/prisma/schema.prisma ./src/prisma/schema.prisma

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Install Prisma CLI with plain npm (no pnpm symlinks)
#           This self-contained install is copied into the runner so that
#           `prisma migrate deploy` works without the full pnpm virtual store.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS prisma-cli
WORKDIR /prisma

RUN apk add --no-cache openssl

# Install prisma + tsx + @prisma/client with npm so that all packages are real
# directories, not pnpm symlinks. tsx runs seed/demo TypeScript files; the
# @prisma/client postinstall downloads the correct Alpine query-engine binary.
RUN npm install --no-save prisma@5.22.0 tsx @prisma/client@5.22.0 bcryptjs

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Build Next.js
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Dummy env vars — only used during `prisma generate` (schema parsing) at build
# time, NOT at runtime. Real secrets come in via docker-compose environment.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/leave_tracking"
ENV DIRECT_URL="postgresql://postgres:postgres@localhost:5432/leave_tracking"
ENV JWT_SECRET="build-time-placeholder"
ENV JWT_REFRESH_SECRET="build-time-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Runs: prisma generate --schema src/prisma/schema.prisma && next build
RUN pnpm build

# pnpm stores the Prisma native binary inside its virtual store, not at the
# top-level node_modules/.prisma the standalone runner expects.
# Consolidate it to the canonical location so the runner COPY step works.
RUN mkdir -p node_modules/.prisma/client && \
    find node_modules -type f \( -name "*.node" -o -name "query-engine-*" \) \
         \( -path "*/.prisma/client/*" -o -path "*/@prisma/client/*.node" \) \
         -exec cp -n {} node_modules/.prisma/client/ \; 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4 — Minimal production runner
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ── Next.js standalone bundle ─────────────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# ── Prisma runtime client (native query-engine binary) ────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma   ./node_modules/.prisma

# ── Prisma CLI (npm-installed, no pnpm symlinks) for migrate deploy ───────────
COPY --from=prisma-cli --chown=nextjs:nodejs /prisma/node_modules     ./prisma-cli/node_modules

# ── Schema + migrations + seed scripts + their TS dependencies ───────────────
COPY --from=builder --chown=nextjs:nodejs /app/src/prisma      ./src/prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/lib         ./src/lib
COPY --from=builder --chown=nextjs:nodejs /app/src/types       ./src/types
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json   ./tsconfig.json


# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
