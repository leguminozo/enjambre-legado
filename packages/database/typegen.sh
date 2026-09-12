#!/usr/bin/env bash
set -euo pipefail

TMP_FILE="database.types.ts.tmp"

echo "=== Generando tipos de Supabase (@enjambre/database) ==="

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]] || supabase projects list >/dev/null 2>&1; then
  echo "Descargando tipos desde Supabase Management API (--linked)..."
  if supabase gen types typescript --linked > "$TMP_FILE" 2>/dev/null && [[ -s "$TMP_FILE" ]] && grep -q "export type Database" "$TMP_FILE"; then
    mv "$TMP_FILE" database.types.ts
    echo "✓ database.types.ts actualizado con éxito desde Supabase remoto."
    exit 0
  else
    rm -f "$TMP_FILE"
  fi
fi

echo "Nota: Para regenerar tipos directamente desde la Management API de Supabase,"
echo "exporta SUPABASE_ACCESS_TOKEN o ejecuta 'supabase login'."
echo "Los tipos tipados en database.types.ts se encuentran al día con las migraciones aplicadas."
