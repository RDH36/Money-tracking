#!/bin/sh
# Compile le module pur lib/analytics/serialStorage.ts puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-analytics-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/analytics/serialStorage.ts --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
SERIAL_OUT="$OUT" ROOT="$ROOT" node --test $(find lib/analytics/__tests__ -name "*.test.js" | sort)
