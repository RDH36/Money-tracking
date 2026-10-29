/**
 * Quota de l'import automatique : N lectures gratuites par cycle (jour de
 * paye s'il est réglé, sinon le 1er du mois : même calcul que le reste de
 * l'app, lib/analysis/cycle). 1 lecture = 1 image dont au moins une opération
 * NOUVELLE a été enregistrée. Pur : la date et les réglages sont injectés.
 */
import { getCurrentCycle } from '../analysis/cycle';
import type { CycleSettings } from '../analysis/types';

/** Constante de build ; un paramètre distant ne pourra que la monter. */
export const OCR_FREE_READS_PER_CYCLE = 5;

/** Limite effective : jamais sous la constante de build. */
export function readsLimit(remote?: number | null): number {
  return typeof remote === 'number' && Number.isFinite(remote)
    ? Math.max(OCR_FREE_READS_PER_CYCLE, Math.floor(remote))
    : OCR_FREE_READS_PER_CYCLE;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface QuotaCycle {
  /** Clé `settings` du compteur : `ocr_reads_{YYYY-MM-DD du début du cycle}`. */
  key: string;
  /** Jour où les lectures reviennent (début du cycle suivant, minuit local). */
  resetsOn: Date;
}

export function quotaCycle(now: Date, settings?: CycleSettings): QuotaCycle {
  const cycle = getCurrentCycle(now, settings);
  return { key: `ocr_reads_${ymd(new Date(cycle.start))}`, resetsOn: new Date(cycle.end) };
}

/** Valeur stockée → nombre de lectures (illisible ou négatif → 0). */
export function parseUsed(raw: string | null | undefined): number {
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function remainingReads(used: number, limit: number): number {
  return Math.max(0, limit - used);
}

export interface ReadPlan {
  /** Images à lire (les N premières). */
  allowed: number;
  /** Partage multiple au-delà du solde : nombre d'images reçues. */
  truncatedFrom: number | null;
  /** Aucune image lisible : afficher « quota atteint ». */
  blocked: boolean;
}

/** Combien d'images d'un partage lire, selon le solde du cycle. */
export function planReads(total: number, remaining: number, unlimited: boolean): ReadPlan {
  if (unlimited || total <= remaining) return { allowed: total, truncatedFrom: null, blocked: false };
  if (remaining <= 0) return { allowed: 0, truncatedFrom: null, blocked: true };
  return { allowed: remaining, truncatedFrom: total, blocked: false };
}

/** Opération réellement enregistrée : image d'origine et doublon coché exprès. */
export interface SavedOperation {
  image?: number;
  forceDuplicate?: boolean;
}

/**
 * Lectures consommées par un enregistrement : nombre d'images distinctes dont
 * au moins une opération NOUVELLE (pas un doublon coché exprès) a été écrite.
 */
export function consumedReads(saved: SavedOperation[]): number {
  const images = new Set<number>();
  for (const s of saved) {
    if (!s.forceDuplicate && typeof s.image === 'number') images.add(s.image);
  }
  return images.size;
}
