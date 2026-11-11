#!/bin/sh
# Compile lib/backup/serialize.ts + constants.ts (purs, expo-sqlite en type seulement) puis lance les tests node:test.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="${TMPDIR:-/tmp}/mitsitsy-backup-test-build"
mkdir -p "$OUT"
cd "$ROOT"
npx tsc lib/backup/serialize.ts lib/backup/constants.ts --outDir "$OUT" --module commonjs --target es2020 --skipLibCheck --strict --ignoreConfig
BACKUP_OUT="$OUT" ROOT="$ROOT" node --test $(find lib/backup/__tests__ -name "*.test.js" | sort)
