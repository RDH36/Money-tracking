/**
 * Mise en page MCB Juice : typage des lignes OCR (en-tête de date, libellé,
 * référence, montant) et regroupement en opérations par position.
 */
import type { OcrLine, OcrPage } from '../types';
import { parseDateHeader } from './dates';
import { asSuperscriptCents, isAmountLine } from './amount';

export type McbLine =
  | { kind: 'date'; date: string; line: OcrLine }
  | { kind: 'ref'; ref: string; line: OcrLine }
  | { kind: 'amount'; line: OcrLine; superscript: string | null }
  | { kind: 'text'; line: OcrLine };

export interface RawOperation {
  date: string | null;
  labels: OcrLine[];
  ref: string | null;
  amount: Extract<McbLine, { kind: 'amount' }>;
}

const REF_RE = /^\s*r[eé]f\s*[:;.,]?\s*(.+)$/i;
// Les références T24 « FT » font 12 caractères : FT + AAJJJ + 5.
const FT_LENGTH = 12;

/** « Ref: FT26301QW7K2\BNK » → `FT26301QW7K2` (antislash souvent mal lu). */
export function readReference(text: string): string | null {
  const m = REF_RE.exec(text);
  if (!m) return null;
  let ref = m[1].replace(/\s+/g, '').toUpperCase().split(/[\\|/¥]/)[0];
  ref = ref.replace(/BNK$/, '');
  if (ref.startsWith('FT') && ref.length > FT_LENGTH) ref = ref.slice(0, FT_LENGTH);
  return /^[A-Z0-9]{8,16}$/.test(ref) ? ref : null;
}

const height = (l: OcrLine) => Math.max(1, l.bottom - l.top);

/** Rattache les centimes en exposant (ligne OCR à part) à leur montant. */
function attachSuperscripts(lines: OcrLine[], width: number) {
  const consumed = new Set<OcrLine>();
  const superscripts = new Map<OcrLine, string>();
  const amounts = lines.filter((l) => isAmountLine(l.text));
  for (const s of lines) {
    const cents = asSuperscriptCents(s.text);
    if (!cents) continue;
    const target = amounts.find(
      (a) =>
        !superscripts.has(a) &&
        s.left >= a.right - width * 0.03 &&
        s.left <= a.right + width * 0.06 &&
        s.top < a.bottom &&
        s.bottom > a.top - height(a) * 0.8
    );
    if (target) {
      superscripts.set(target, cents);
      consumed.add(s);
    }
  }
  return { consumed, superscripts };
}

export function typeLines(page: OcrPage): McbLine[] {
  const { consumed, superscripts } = attachSuperscripts(page.lines, page.width);
  return page.lines
    .filter((l) => !consumed.has(l) && l.text.trim() !== '')
    .sort((a, b) => a.top - b.top || a.left - b.left)
    .map((line): McbLine => {
      const date = parseDateHeader(line.text);
      if (date) return { kind: 'date', date, line };
      const ref = readReference(line.text);
      if (ref) return { kind: 'ref', ref, line };
      if (isAmountLine(line.text)) {
        return { kind: 'amount', line, superscript: superscripts.get(line) ?? null };
      }
      return { kind: 'text', line };
    });
}

/**
 * Lignes de libellé d'une opération : lignes de texte alignées à gauche,
 * contiguës, juste au-dessus de la référence (ou du montant si la référence
 * n'a pas été lue). Écarte le décor de l'appli (titres, boutons).
 */
function pickLabels(texts: OcrLine[], anchor: OcrLine, anchorIsRef: boolean, width: number): OcrLine[] {
  const picked: OcrLine[] = [];
  let prev = anchor;
  for (let i = texts.length - 1; i >= 0 && picked.length < 4; i--) {
    const line = texts[i];
    const aligned = anchorIsRef
      ? Math.abs(line.left - anchor.left) <= width * 0.04
      : line.left <= width * 0.25;
    if (!aligned) continue;
    const maxGap = height(line) * (prev === anchor && !anchorIsRef ? 3.5 : 1.2);
    if (prev.top - line.bottom > maxGap) break;
    picked.unshift(line);
    prev = line;
  }
  return picked;
}

export function groupOperations(lines: McbLine[], width: number): { raw: RawOperation[]; partial: number } {
  const raw: RawOperation[] = [];
  let partial = 0;
  let date: string | null = null;
  let texts: OcrLine[] = [];
  let ref: Extract<McbLine, { kind: 'ref' }> | null = null;

  for (const item of lines) {
    if (item.kind === 'date') {
      if (ref) partial++; // libellé + référence sans montant
      date = item.date;
      texts = [];
      ref = null;
    } else if (item.kind === 'text') {
      if (!ref) texts.push(item.line);
    } else if (item.kind === 'ref') {
      if (ref) partial++;
      ref = item;
    } else {
      const anchor = ref ? ref.line : item.line;
      const labels = pickLabels(texts, anchor, !!ref, width);
      if (labels.length === 0 && !ref) partial++; // montant seul : coupé en haut
      else raw.push({ date, labels, ref: ref?.ref ?? null, amount: item });
      texts = [];
      ref = null;
    }
  }
  if (ref) partial++; // coupé en bas avant le montant
  return { raw, partial };
}
