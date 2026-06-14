#!/usr/bin/env bash
set -euo pipefail

# Colors for visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo -e "${YELLOW}LOCAL VERCEL SIMULATION${NC}"
echo "Run this BEFORE any 'git push' or 'derivar a Vercel'."
echo "It executes the EXACT same steps Vercel runs:"
echo "  1. pnpm install --frozen-lockfile"
echo "  2. turbo build --filter=@enjambre/contable --filter=@enjambre/nucleo --filter=@enjambre/tienda"
echo ""
echo "This is the fastest way to know if SII / build / TypeScript errors"
echo "are STILL occurring locally (instead of discovering them only on iad1)."
echo "=================================================="
echo ""

# Trap to give a very clear failure message
failure() {
  echo ""
  echo -e "${RED}=================================================="
  echo "❌  ERRORES DETECTADOS LOCALMENTE"
  echo "=================================================="
  echo -e "${NC}"
  echo "SII / build / type errors are STILL present."
  echo "DO NOT push main or send to Vercel yet."
  echo ""
  echo "Fix the errors shown above, then run again:"
  echo "  pnpm verify"
  echo ""
  exit 1
}

trap failure ERR

echo ">>> [1/2] pnpm install --frozen-lockfile (exact match to Vercel)"
pnpm install --frozen-lockfile

echo ""
echo ">>> [2/2] turbo build for the packages that have been failing (contable + nucleo + tienda)"
pnpm turbo build --filter=@enjambre/contable --filter=@enjambre/nucleo --filter=@enjambre/tienda

echo ""
echo -e "${GREEN}=================================================="
echo "✅  LOCAL BUILD PASSED — NO ERRORS DETECTED"
echo "=================================================="
echo -e "${NC}"
echo "Safe to push main and let Vercel do the real deployment."
echo "Next time you want to know before Vercel:  pnpm verify"
echo ""
