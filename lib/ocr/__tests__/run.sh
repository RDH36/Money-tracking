#!/bin/sh
# Compile le code pur de lib/ocr puis lance les tests node:test (Node 20, sans dépendance).
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-ocr-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/ocr/index.ts lib/ocr/suggest.ts lib/ocr/import/review.ts lib/ocr/import/pickFlow.ts lib/ocr/import/analytics.ts lib/ocr/__fixtures__/mcbPages.ts lib/ocr/__fixtures__/ticketPages.ts \
  lib/ocr/mcb/amount.ts lib/ocr/mcb/dates.ts lib/ocr/mcb/classify.ts lib/ocr/text.ts \
  lib/database/migrations.ts lib/database/migrationV27.ts lib/backup/deserialize.ts \
  lib/habit/deferSlot.ts lib/habit/habitPrompt.ts lib/habit/todayStats.ts \
  --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
OCR_OUT="$OUT/ocr" node --test $(find lib/ocr/__tests__ -name "*.test.js" | sort)
