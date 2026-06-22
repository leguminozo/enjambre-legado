#!/usr/bin/env bash
# Crea .env.secrets.local desde apps/nucleo/.env.local (sin service_role).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/.env.secrets.local"
NUCLEO="$ROOT/apps/nucleo/.env.local"

if [[ -f "$SECRETS" ]]; then
  echo "✓ $SECRETS ya existe"
  exit 0
fi

read_var() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d= -f2- || true
}

URL="https://hdhamxiblwwskvvqbcfo.supabase.co"
PUBLISHABLE=""

if [[ -f "$NUCLEO" ]]; then
  URL="$(read_var "$NUCLEO" NEXT_PUBLIC_SUPABASE_URL)"
  URL="${URL:-https://hdhamxiblwwskvvqbcfo.supabase.co}"
  PUBLISHABLE="$(read_var "$NUCLEO" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)"
fi

cat > "$SECRETS" <<EOF
# Gitignored — completa SUPABASE_SERVICE_ROLE_KEY desde Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=${URL}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${PUBLISHABLE}

# OBLIGATORIO — service_role JWT (eyJ...), nunca en cliente
SUPABASE_SERVICE_ROLE_KEY=

# Opcional — bootstrap genera uno si falta
# INTERNAL_API_SECRET=
EOF

echo "Creado $SECRETS"
echo "Pega SUPABASE_SERVICE_ROLE_KEY y ejecuta: pnpm go-live:bootstrap"