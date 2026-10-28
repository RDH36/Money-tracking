/**
 * Registre des parseurs par source et détection automatique. Prochaines
 * sources prévues : BNI, BOA, BRED, tickets papier (un SourceParser chacun).
 */
import type { OcrPage, ParseResult, SourceParser } from './types';
import { mcbParser } from './mcb';

export const SOURCE_PARSERS: SourceParser[] = [mcbParser];

/** Seuil de confiance minimal pour attribuer une page à une source. */
const MIN_CONFIDENCE = 0.5;

export function detectSource(page: OcrPage, parsers = SOURCE_PARSERS): SourceParser | null {
  let best: SourceParser | null = null;
  let bestScore = MIN_CONFIDENCE;
  for (const parser of parsers) {
    const score = parser.detect(page);
    if (score >= bestScore) {
      best = parser;
      bestScore = score;
    }
  }
  return best;
}

export interface PageResult extends ParseResult {
  /** Id de la source reconnue, null si la capture n'est pas reconnue. */
  source: string | null;
}

export function parsePage(page: OcrPage, parsers = SOURCE_PARSERS): PageResult {
  const parser = detectSource(page, parsers);
  if (!parser) return { source: null, operations: [], partial: 0 };
  return { source: parser.id, ...parser.parse(page) };
}
