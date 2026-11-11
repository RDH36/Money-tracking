/**
 * Mise en page générique d'un relevé à l'écran (n'importe quelle appli) :
 * typage des lignes OCR (en-tête de jour, montant, solde, texte) puis
 * regroupement géométrique autour de chaque montant : chaque ligne de texte
 * rejoint le montant le plus proche verticalement, dans la même section de date.
 */
import type { OcrLine, OcrPage } from '../types';
import { normalizeText } from '../text';
import { byTop, centerY, lineHeight } from '../tickets/geometry';
import { findAmounts, isAmountOnlyLine, type FoundAmount } from './amount';
import { parseDayHeader } from './dates';

/** Solde, plafond, disponible : jamais une opération. */
export const BALANCE_RE = /\b(solde|soldes|disponible|balance|available|volanao|sisa)\b/;
// Lignes de décor : heure de la barre d'état, titres, boutons.
const DECOR_RE = /^(transactions?|historique|voir historique|operations?|tout afficher|voir tout|see all|history|mouvements?)$/;

export interface AmountRow {
  line: OcrLine;
  amount: FoundAmount;
  /** Texte de la ligne hors montant (libellé collé au montant), peut être vide. */
  inlineLabel: string;
  /** Date de l'en-tête de jour au-dessus, null si aucun. */
  headerDate: string | null;
  labels: OcrLine[];
  /** Section de date (en-têtes de jour) : un libellé ne passe pas d'une section à l'autre. */
  section: number;
}

export interface GenericLayout {
  rows: AmountRow[];
  /** Montants sans libellé (coupés au bord de la capture). */
  partial: number;
}

function isDecor(text: string): boolean {
  const t = normalizeText(text).replace(/[[\]()]/g, '').trim();
  return t.length < 2 || DECOR_RE.test(t) || /^\d{1,2}[:h]\d{2}/.test(t);
}

export function layoutPage(page: OcrPage, today: string): GenericLayout {
  const rows: AmountRow[] = [];
  const texts: { line: OcrLine; section: number }[] = [];
  let headerDate: string | null = null;
  let section = 0;
  for (const line of byTop(page.lines)) {
    const text = line.text.trim();
    if (!text) continue;
    const date = parseDayHeader(text, today);
    if (date) {
      headerDate = date;
      section++;
      continue;
    }
    const amounts = findAmounts(text);
    const balance = BALANCE_RE.test(normalizeText(text));
    if (amounts.length > 0 && !balance) {
      const a = amounts[amounts.length - 1];
      const inlineLabel = isAmountOnlyLine(text) ? '' : (text.slice(0, a.start) + text.slice(a.end)).trim();
      rows.push({ line, amount: a, inlineLabel, headerDate, labels: [], section });
      continue;
    }
    if (balance || isDecor(text)) continue;
    texts.push({ line, section });
  }

  // Page où les montants portent devise ou signe : un nombre nu (« 138 670 »)
  // est un morceau de libellé, pas une opération.
  const strong = (r: AmountRow) => r.amount.currency !== null || r.amount.sign !== 0;
  if (rows.some(strong)) {
    for (const r of rows.filter((x) => !strong(x))) texts.push({ line: r.line, section: r.section });
    rows.splice(0, rows.length, ...rows.filter(strong));
  }

  // Chaque ligne de texte va au montant le plus proche de sa section (≤ 3 lignes).
  for (const { line, section: s } of texts) {
    let best: AmountRow | null = null;
    let bestGap = lineHeight(line) * 3;
    for (const row of rows) {
      if (row.section !== s) continue;
      if (line.left >= row.line.right) continue;
      const gap = Math.abs(centerY(line) - centerY(row.line));
      if (gap <= bestGap) {
        best = row;
        bestGap = gap;
      }
    }
    best?.labels.push(line);
  }

  let partial = 0;
  const kept = rows.filter((r) => {
    if (r.labels.length > 0 || r.inlineLabel.replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 3) return true;
    partial++;
    return false;
  });
  for (const r of kept) r.labels = byTop(r.labels);
  return { rows: kept, partial };
}
