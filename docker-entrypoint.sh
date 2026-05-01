#!/bin/sh
set -e

# npm-installed tools live here (prisma, tsx, @prisma/client — no pnpm symlinks)
TOOLS="./prisma-cli/node_modules"
PRISMA="$TOOLS/.bin/prisma"
# Make @prisma/client and tsx resolvable when running seed/demo scripts
export NODE_PATH="$TOOLS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Leave Tracking System — Starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Wait for PostgreSQL TCP port ─────────────────────────────────────────
echo "⟳  Waiting for database..."
MAX_RETRIES=30
RETRY=0

DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|.*@||' -e 's|:.*||' -e 's|/.*||')
DB_PORT=$(echo "$DATABASE_URL" | sed -e 's|.*@[^:]*:||' -e 's|/.*||')
DB_PORT=${DB_PORT:-5432}

until node -e "
  const net = require('net');
  const s = net.createConnection({ host: '$DB_HOST', port: $DB_PORT });
  s.on('connect', () => { s.destroy(); process.exit(0); });
  s.on('error',   () => process.exit(1));
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "✗  Database did not become ready in time. Exiting."
    exit 1
  fi
  echo "   (attempt $RETRY/$MAX_RETRIES — retrying in 2s)"
  sleep 2
done
echo "✓  Database is ready"

# ── 2. Run pending migrations ────────────────────────────────────────────────
echo "⟳  Applying database migrations..."
"$PRISMA" migrate deploy --schema src/prisma/schema.prisma
echo "✓  Migrations applied"

# ── 3. Start Next.js ─────────────────────────────────────────────────────────
echo "⟳  Starting Next.js on port ${PORT:-3000}..."
echo ""
exec node server.js
