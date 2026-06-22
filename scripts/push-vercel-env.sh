#!/usr/bin/env bash
# Sube variables de .env.secrets.local a los 3 proyectos Vercel (production + preview).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="$ROOT/.env.secrets.local"

if [[ ! -f "$SECRETS" ]]; then
  echo "Falta $SECRETS — copia desde .env.secrets.local.example"
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS"

: "${SUPABASE_SERVICE_ROLE_KEY:?Falta SUPABASE_SERVICE_ROLE_KEY}"
INTERNAL_API_SECRET="${INTERNAL_API_SECRET:-$(openssl rand -hex 32)}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://hdhamxiblwwskvvqbcfo.supabase.co}"
PUBLISHABLE="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:-}"

if [[ -z "$PUBLISHABLE" && -f "$ROOT/apps/nucleo/.env.local" ]]; then
  PUBLISHABLE="$(grep -E '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=' "$ROOT/apps/nucleo/.env.local" | cut -d= -f2- || true)"
fi

# URLs producción — resolver desde Vercel CLI si existen
resolve_url() {
  local dir="$1" fallback="$2"
  local url
  url="$(cd "$dir" && vercel ls --prod 2>/dev/null | awk '/https:/{print $2; exit}' || true)"
  if [[ -n "$url" && "$url" == https://* ]]; then
    echo "$url"
  else
    echo "$fallback"
  fi
}

NUCLEO_URL="${NUCLEO_PRODUCTION_URL:-$(resolve_url "$ROOT/apps/nucleo" "https://nucleo-theta.vercel.app")}"
TIENDA_URL="${TIENDA_PRODUCTION_URL:-$(resolve_url "$ROOT/apps/tienda" "https://tienda.vercel.app")}"
CAMPO_URL="${CAMPO_PRODUCTION_URL:-$(resolve_url "$ROOT/apps/campo" "https://campo.vercel.app")}"

add_env() {
  local dir="$1" env_name="$2" key="$3" val="$4"
  echo "  → [$env_name] $key en $(basename "$dir")"
  (cd "$dir" && printf '%s' "$val" | vercel env add "$key" "$env_name" --force 2>/dev/null) || \
    (cd "$dir" && printf '%s' "$val" | vercel env add "$key" "$env_name")
}

push_app_env() {
  local dir="$1"
  local env_name="$2"
  shift 2
  while [[ $# -ge 2 ]]; do
    add_env "$dir" "$env_name" "$1" "$2"
    shift 2
  done
}

echo "=== Vercel env push ==="
echo "Núcleo: $NUCLEO_URL"
echo "Tienda: $TIENDA_URL"
echo "Campo:  $CAMPO_URL"
echo ""

for TARGET in production preview; do
  echo "--- $TARGET ---"
  push_app_env "$ROOT/apps/nucleo" "$TARGET" \
    NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY "$PUBLISHABLE" \
    SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" \
    INTERNAL_API_SECRET "$INTERNAL_API_SECRET" \
    NEXT_PUBLIC_NUCLEO_API_URL "$NUCLEO_URL" \
    NEXT_PUBLIC_URL_TIENDA "$TIENDA_URL" \
    NEXT_PUBLIC_URL_CAMPO "$CAMPO_URL"

  push_app_env "$ROOT/apps/tienda" "$TARGET" \
    NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY "$PUBLISHABLE" \
    SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" \
    NEXT_PUBLIC_NUCLEO_API_URL "$NUCLEO_URL" \
    NEXT_PUBLIC_SITE_URL "$TIENDA_URL"

  push_app_env "$ROOT/apps/campo" "$TARGET" \
    NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "$PUBLISHABLE" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY "$PUBLISHABLE" \
    NEXT_PUBLIC_NUCLEO_API_URL "$NUCLEO_URL"
done

# Persistir INTERNAL_API_SECRET en secrets local para reutilizar
if ! grep -q '^INTERNAL_API_SECRET=' "$SECRETS" 2>/dev/null; then
  echo "INTERNAL_API_SECRET=$INTERNAL_API_SECRET" >> "$SECRETS"
fi

echo ""
echo "✓ Variables subidas (production + preview)."
echo "  Redeploy: Vercel Dashboard → Deployments → Redeploy (o push a main si Git conectado)"