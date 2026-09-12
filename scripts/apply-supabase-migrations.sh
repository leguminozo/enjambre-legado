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

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres.hdhamxiblwwskvvqbcfo:wPjlDRunFOQ6JgEC@aws-1-sa-east-1.pooler.supabase.com:5432/postgres}"

cd "$DB_DIR"
echo "Últimas migraciones locales:"
ls -1 supabase/migrations/*.sql | tail -5
echo ""

if [[ -n "${DB_URL:-}" ]]; then
  echo "Aplicando migraciones a producción vía DB_URL..."
  supabase db push --include-all --db-url "$DB_URL"
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]] || supabase projects list >/dev/null 2>&1; then
  supabase link --project-ref hdhamxiblwwskvvqbcfo 2>/dev/null || true
  supabase db push --linked
else
  echo "Ejecuta: supabase login"
  echo "O exporta SUPABASE_ACCESS_TOKEN o SUPABASE_DB_URL"
  exit 1
fi

echo ""
echo "✓ Migraciones aplicadas. Verifica RPC:"
echo "  select public.get_sidebar_badges();"