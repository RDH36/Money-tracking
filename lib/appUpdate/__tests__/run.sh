#!/bin/sh
# Compile lib/appUpdate/policy.ts puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-appupdate-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/appUpdate/policy.ts --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
APPUPDATE_OUT="$OUT" ROOT="$ROOT" node --test $(find lib/appUpdate/__tests__ -name "*.test.js" | sort)
