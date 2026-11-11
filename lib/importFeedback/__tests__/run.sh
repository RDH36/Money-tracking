#!/bin/sh
# Compile le code pur de lib/importFeedback (règles, stockage, envoi, rappel) puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-importfeedback-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/importFeedback/index.ts lib/importFeedback/reminder.ts \
  --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
FEEDBACK_OUT="$OUT" ROOT="$ROOT" node --test $(find lib/importFeedback/__tests__ -name "*.test.js" | sort)
