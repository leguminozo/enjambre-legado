#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='border-[^"'\''`]*rounded-full[^"'\''`]*animate-spin|animate-spin[^"'\''`]*border-[^"'\''`]*rounded-full'

matches="$(rg -n "$PATTERN" \
  apps/nucleo/src/views \
  apps/campo/src \
  apps/tienda/app \
  apps/tienda/components \
  --glob '*.tsx' \
  --glob '!**/toast.tsx' 2>/dev/null || true)"

if [ -n "$matches" ]; then
  echo "❌ Legacy border-spin loaders in views (use HexagonLoader / ViewLoading):"
  echo "$matches"
  exit 1
fi

echo "✓ No legacy border-spin loaders in views"