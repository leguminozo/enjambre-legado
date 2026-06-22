#!/usr/bin/env bash
# Aplica migraciones pendientes a Supabase producción (hdhamxiblwwskvvqbcfo).
# Requiere: supabase login  O  SUPABASE_ACCESS_TOKEN en el entorno.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_DIR="$ROOT/packages/database"

echo "=== Supabase migrations → producción ==="
echo "Proyecto: hdhamxiblwwskvvqbcfo"
echo ""

if ! command -v supabase >/dev/null 2>&1; then
  echo "Instala Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  if ! supabase projects list >/dev/null 2>&1; then
    echo "Ejecuta: supabase login"
    echo "O exporta SUPABASE_ACCESS_TOKEN desde Dashboard → Account → Access Tokens"
    exit 1
  fi
fi

cd "$DB_DIR"
echo "Últimas migraciones locales:"
ls -1 supabase/migrations/*.sql | tail -5
echo ""

supabase link --project-ref hdhamxiblwwskvvqbcfo 2>/dev/null || true
supabase db push --linked

echo ""
echo "✓ Migraciones aplicadas. Verifica RPC:"
echo "  select public.get_sidebar_badges();"