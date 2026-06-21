#!/usr/bin/env bash
# Sube variables de .env.secrets.local a los 3 proyectos Vercel (production).
# Requiere: vercel link en cada app y SUPABASE_SERVICE_ROLE_KEY en .env.secrets.local
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/.env.secrets.local"

if [[ ! -f "$SECRETS" ]]; then
  echo "Falta $SECRETS — ejecuta bootstrap-local-env.sh primero."
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS"

: "${SUPABASE_SERVICE_ROLE_KEY:?Falta SUPABASE_SERVICE_ROLE_KEY}"
INTERNAL_API_SECRET="${INTERNAL_API_SECRET:-$(openssl rand -hex 32)}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://hdhamxiblwwskvvqbcfo.supabase.co}"
PUBLISHABLE="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:-}"

add_env() {
  local dir="$1" key="$2" val="$3"
  echo "  → $key en $(basename "$dir")"
  cd "$dir"
  printf '%s' "$val" | vercel env add "$key" production --force 2>/dev/null || \
    printf '%s' "$val" | vercel env add "$key" production
}

echo "=== Vercel env push (production) ==="
echo "Proyectos: nucleo-theta, tienda, campo"
echo ""

add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE"
add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_SUPABASE_ANON_KEY "$PUBLISHABLE"
add_env "$ROOT/apps/nucleo" SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
add_env "$ROOT/apps/nucleo" INTERNAL_API_SECRET "$INTERNAL_API_SECRET"
add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_NUCLEO_API_URL "https://nucleo-theta.vercel.app"
add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_URL_TIENDA "https://tienda-gabos-projects-e4e7d9ab.vercel.app"
add_env "$ROOT/apps/nucleo" NEXT_PUBLIC_URL_CAMPO "https://campo-gabos-projects-e4e7d9ab.vercel.app"

add_env "$ROOT/apps/tienda" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
add_env "$ROOT/apps/tienda" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE"
add_env "$ROOT/apps/tienda" SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
add_env "$ROOT/apps/tienda" NEXT_PUBLIC_NUCLEO_API_URL "https://nucleo-theta.vercel.app"

add_env "$ROOT/apps/campo" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
add_env "$ROOT/apps/campo" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE"
add_env "$ROOT/apps/campo" NEXT_PUBLIC_NUCLEO_API_URL "https://nucleo-theta.vercel.app"

echo ""
echo "✓ Variables subidas. Redeploy:"
echo "  cd apps/nucleo && vercel --prod"
echo "  cd apps/tienda && vercel --prod"
echo "  cd apps/campo && vercel --prod"