#!/usr/bin/env bash
# Sube secretos de .env.secrets.local a GitHub Actions (repo guillermoc2710-cmd/enjambre-legado)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/.env.secrets.local"
REPO="guillermoc2710-cmd/enjambre-legado"

if [[ ! -f "$SECRETS" ]]; then
  echo "Falta $SECRETS — copia desde .env.secrets.local.example"
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS"

: "${SUPABASE_SERVICE_ROLE_KEY:?Falta SUPABASE_SERVICE_ROLE_KEY}"
: "${NEXT_PUBLIC_SUPABASE_URL:=https://hdhamxiblwwskvvqbcfo.supabase.co}"

PUBLISHABLE="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:-}"
if [[ -z "$PUBLISHABLE" && -f "$ROOT/apps/nucleo/.env.local" ]]; then
  PUBLISHABLE="$(grep -E '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=' "$ROOT/apps/nucleo/.env.local" | cut -d= -f2- || true)"
fi

echo "=== GitHub Actions secrets → $REPO ==="
gh auth status >/dev/null

set_secret() {
  local name="$1" val="$2"
  echo "  → $name"
  printf '%s' "$val" | gh secret set "$name" --repo "$REPO"
}

set_secret "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
set_secret "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" "$PUBLISHABLE"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$PUBLISHABLE"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  set_secret "INTERNAL_API_SECRET" "$INTERNAL_API_SECRET"
fi

echo ""
echo "✓ Secrets subidos. El próximo push a main usará env en build-nucleo/tienda/campo."