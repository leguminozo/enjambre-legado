#!/usr/bin/env bash
# Ejecuta el pipeline Fase 0 en orden (falla si falta service_role).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "═══ Fase 0 — apply ═══"
echo ""

bash scripts/init-secrets-local.sh

if ! grep -qE '^SUPABASE_SERVICE_ROLE_KEY=eyJ' .env.secrets.local 2>/dev/null; then
  echo ""
  echo "Bloqueado: falta SUPABASE_SERVICE_ROLE_KEY en .env.secrets.local"
  echo "Supabase → hdhamxiblwwskvvqbcfo → Settings → API → service_role"
  exit 1
fi

pnpm go-live:bootstrap
pnpm go-live:vercel-setup
pnpm go-live:vercel-env
pnpm go-live:github-secrets

echo ""
echo "═══ Auditoría final ═══"
pnpm go-live:phase0

echo ""
echo "Manual (una vez): Vercel Dashboard → Settings → Git en nucleo-theta, tienda, campo"
echo "  Repo: guillermoc2710-cmd/enjambre-legado · rama main"
echo ""
echo "Luego: pnpm go-live:smoke:prod"