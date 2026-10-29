/**
 * Registre des parseurs par source et détection automatique. Sources :
 * captures MCB Juice, tickets GAB BOA, tickets carte BMOI, tickets de caisse
 * (lecteur générique). Prochaines : BNI, BOA, BRED (un SourceParser chacun).
 */
import type { OcrPage, ParseResult, SourceParser } from './types';
import { mcbParser } from './mcb';
import { boaGabParser } from './tickets/boa-gab';
import { bmoiTpeParser } from './tickets/bmoi-tpe';
import { receiptParser } from './tickets/receipt';
import { orientations } from './tickets/geometry';

export const SOURCE_PARSERS: SourceParser[] = [mcbParser, boaGabParser, bmoiTpeParser, receiptParser];

/** Seuil de confiance minimal pour attribuer une page à une source. */
const MIN_CONFIDENCE = 0.5;

export function detectSource(page: OcrPage, parsers = SOURCE_PARSERS): SourceParser | null {
  let best: SourceParser | null = null;
  let bestScore = MIN_CONFIDENCE;
  const tickets: SourceParser[] = [];
  for (const parser of parsers) {
    const score = parser.detect(page);
    if (score >= MIN_CONFIDENCE && parser.ticket) tickets.push(parser);
    if (score >= bestScore) {
      best = parser;
      bestScore = score;
    }
  }
  // Plusieurs tickets de sortes différentes sur une même photo : on ne devine pas.
  if (best?.ticket && tickets.length > 1) return null;
  return best;
}

export interface PageResult extends ParseResult {
  /** Id de la source reconnue, null si la capture n'est pas reconnue. */
  source: string | null;
}

/**
 * Photo pivotée de 90° : on essaie les deux sens de lecture. Des tickets de
 * sortes différentes repérés sur la photo (dans un sens ou l'autre) : non
 * reconnue, plutôt qu'un mélange de champs de deux tickets.
 */
export function parsePage(page: OcrPage, parsers = SOURCE_PARSERS): PageResult {
  const none: PageResult = { source: null, operations: [], partial: 0 };
  const candidates = orientations(page);
  const tickets = new Set<string>();
  for (const oriented of candidates) {
    for (const p of parsers) if (p.ticket && p.detect(oriented) >= MIN_CONFIDENCE) tickets.add(p.id);
  }
  if (tickets.size > 1) return none;
  let fallback = none;
  for (const oriented of candidates) {
    const parser = detectSource(oriented, parsers);
    if (!parser) continue;
    const result = { source: parser.id, ...parser.parse(oriented) };
    if (result.operations.length > 0) return result;
    if (!fallback.source) fallback = result;
  }
  return fallback;
}
