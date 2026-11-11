#!/bin/sh
# Compile le helper pur lib/icons/safeIcon.ts puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-icons-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/icons/safeIcon.ts --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
ICONS_OUT="$OUT" ROOT="$ROOT" node --test $(find lib/icons/__tests__ -name "*.test.js" | sort)
