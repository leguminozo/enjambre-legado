#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/.env.secrets.local"

echo "=== Bootstrap env local — Enjambre Legado ==="

if [[ ! -f "$SECRETS" ]]; then
  cat > "$SECRETS" <<'EOF'
# Gitignored — pega desde Supabase Dashboard → Settings → API
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
EOF
  echo "Creado $SECRETS — pega SUPABASE_SERVICE_ROLE_KEY y vuelve a ejecutar."
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" && -f "$ROOT/apps/nucleo/.env.local" ]]; then
  SUPABASE_SERVICE_ROLE_KEY="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$ROOT/apps/nucleo/.env.local" | cut -d= -f2- || true)"
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Falta SUPABASE_SERVICE_ROLE_KEY en $SECRETS"
  echo "Supabase Dashboard → hdhamxiblwwskvvqbcfo → Settings → API → service_role"
  exit 1
fi

INTERNAL_API_SECRET="${INTERNAL_API_SECRET:-$(openssl rand -hex 32)}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://hdhamxiblwwskvvqbcfo.supabase.co}"
PUBLISHABLE="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:-}"

if [[ -f "$ROOT/apps/nucleo/.env.local" ]]; then
  PUBLISHABLE="${PUBLISHABLE:-$(grep -E '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=' "$ROOT/apps/nucleo/.env.local" | cut -d= -f2- || true)}"
fi

append_or_replace() {
  local file="$1" key="$2" val="$3"
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" "$file" && rm -f "${file}.bak"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

# Núcleo — puerto 3000
NUCLEO_ENV="$ROOT/apps/nucleo/.env.local"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" "$PUBLISHABLE"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$PUBLISHABLE"
append_or_replace "$NUCLEO_ENV" "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
append_or_replace "$NUCLEO_ENV" "INTERNAL_API_SECRET" "$INTERNAL_API_SECRET"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_NUCLEO_API_URL" "http://localhost:3000"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_URL_TIENDA" "http://localhost:3001"
append_or_replace "$NUCLEO_ENV" "NEXT_PUBLIC_URL_CAMPO" "http://localhost:3002"

# Tienda — puerto 3001
TIENDA_ENV="$ROOT/apps/tienda/.env.local"
append_or_replace "$TIENDA_ENV" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
append_or_replace "$TIENDA_ENV" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" "$PUBLISHABLE"
append_or_replace "$TIENDA_ENV" "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
append_or_replace "$TIENDA_ENV" "INTERNAL_API_SECRET" "$INTERNAL_API_SECRET"
append_or_replace "$TIENDA_ENV" "NEXT_PUBLIC_SITE_URL" "http://localhost:3001"
append_or_replace "$TIENDA_ENV" "NEXT_PUBLIC_NUCLEO_API_URL" "http://localhost:3000"

# Campo — puerto 3002
CAMPO_ENV="$ROOT/apps/campo/.env.local"
append_or_replace "$CAMPO_ENV" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
append_or_replace "$CAMPO_ENV" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" "$PUBLISHABLE"
append_or_replace "$CAMPO_ENV" "NEXT_PUBLIC_NUCLEO_API_URL" "http://localhost:3000"
append_or_replace "$CAMPO_ENV" "NEXT_PUBLIC_URL_TIENDA" "http://localhost:3001"

if ! grep -q '^INTERNAL_API_SECRET=' "$SECRETS" 2>/dev/null; then
  echo "INTERNAL_API_SECRET=$INTERNAL_API_SECRET" >> "$SECRETS"
fi

echo ""
echo "✓ Env local actualizado (nucleo/tienda/campo)"
echo "  INTERNAL_API_SECRET en nucleo/.env.local y .env.secrets.local"
echo ""
echo "Siguiente:"
echo "  node scripts/go-live-check.mjs"
echo "  pnpm verify"
echo "  pnpm --filter @enjambre/nucleo dev   # :3000"
echo "  pnpm --filter @enjambre/tienda dev -- --port 3001"
echo "  pnpm --filter @enjambre/campo dev    # :3002"