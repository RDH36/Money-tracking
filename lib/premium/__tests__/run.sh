#!/bin/sh
# Compile le code pur de lib/premium (licence, quota) puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-premium-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/premium/index.ts lib/ocr/import/analytics.ts --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict
NODE_PATH="$ROOT/node_modules" PREMIUM_OUT="$OUT/premium" ANALYTICS_OUT="$OUT/ocr/import" ROOT="$ROOT" node --test lib/premium/__tests__/
