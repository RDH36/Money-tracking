#!/bin/sh
# Compile le code pur de lib/ocr puis lance les tests node:test (Node 20, sans dépendance).
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-ocr-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/ocr/index.ts lib/ocr/suggest.ts lib/ocr/import/review.ts lib/ocr/__fixtures__/mcbPages.ts \
  lib/ocr/mcb/amount.ts lib/ocr/mcb/dates.ts lib/ocr/mcb/classify.ts lib/ocr/text.ts \
  lib/database/migrations.ts lib/backup/deserialize.ts \
  --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict
OCR_OUT="$OUT" node --test lib/ocr/__tests__/
