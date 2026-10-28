/**
 * Parseur des captures de l'appli bancaire MCB Juice (com.mcbmd.juice),
 * écran « Compte à vue › Transactions ».
 */
import type { OcrPage, ParsedOperation, ParseResult, SourceParser, UncertainField } from '../types';
import { daysBetween, isGreenish, isNeutralColor, normalizeText } from '../text';
import { dateFromReference, parseDateHeader } from './dates';
import { isAmountLine, parseAmount } from './amount';
import { classifyLabel, type Direction } from './classify';
import { groupOperations, readReference, typeLines, type RawOperation } from './layout';

const BRAND_RE = /\b(compte a vue|transactions recentes|tout afficher|releves)\b/;

function detect(page: OcrPage): number {
  let refs = 0;
  let amounts = 0;
  let dates = 0;
  let brand = 0;
  for (const { text } of page.lines) {
    if (readReference(text) && /bnk|ft\d/i.test(text)) refs++;
    else if (/\bMGA\b/.test(text) && isAmountLine(text)) amounts++;
    else if (parseDateHeader(text)) dates++;
    else if (BRAND_RE.test(normalizeText(text))) brand = 1;
  }
  return Math.min(1, refs * 0.35 + Math.min(amounts, dates) * 0.25 + brand * 0.1);
}

/** Sens du montant : signe lu, puis couleur (crédit en vert), puis mots-clés. */
function resolveDirection(
  negative: boolean,
  color: string | null | undefined,
  hint: Direction | null
): { direction: Direction; uncertain: boolean } {
  if (negative) return { direction: 'debit', uncertain: isGreenish(color) || hint === 'credit' };
  if (isGreenish(color)) return { direction: 'credit', uncertain: hint === 'debit' };
  // Montant sombre sans signe : les crédits MCB sont toujours verts, donc le
  // « - » a été perdu par l'OCR.
  if (isNeutralColor(color)) return { direction: 'debit', uncertain: hint !== 'debit' };
  return { direction: hint ?? 'credit', uncertain: hint === null };
}

function toOperation(raw: RawOperation): ParsedOperation | null {
  if (raw.labels.length === 0) return null;
  const amount = parseAmount(raw.amount.line.text, raw.amount.superscript);
  if (!amount || amount.cents === 0) return null;

  const refDate = dateFromReference(raw.ref);
  const date = raw.date ?? refDate;
  if (!date) return null;

  const label = raw.labels.map((l) => l.text.trim()).join(' ').replace(/\s+/g, ' ');
  const info = classifyLabel(label);
  const { direction, uncertain: signUncertain } = resolveDirection(
    amount.negative, raw.amount.line.color, info.direction
  );
  const kind = info.kind === 'transfer' ? 'transfer' : direction === 'debit' ? 'expense' : 'income';

  const uncertain: UncertainField[] = [];
  if (amount.uncertain) uncertain.push('amount');
  if (signUncertain) uncertain.push('sign');
  if (raw.date && refDate && daysBetween(raw.date, refDate) > 1) uncertain.push('date');
  if (!raw.ref) uncertain.push('reference');

  return {
    source: 'mcb',
    reference: raw.ref,
    date,
    label,
    note: info.note,
    amount: direction === 'debit' ? -amount.cents : amount.cents,
    currency: amount.currency,
    kind,
    merchant: info.merchant,
    categoryHint: kind === 'expense' ? info.categoryHint : null,
    uncertain,
  };
}

function parse(page: OcrPage): ParseResult {
  const { raw, partial } = groupOperations(typeLines(page), page.width);
  const operations: ParsedOperation[] = [];
  let dropped = 0;
  for (const r of raw) {
    const op = toOperation(r);
    if (op) operations.push(op);
    else dropped++;
  }
  return { operations, partial: partial + dropped };
}

export const mcbParser: SourceParser = { id: 'mcb', label: 'MCB Juice', detect, parse };
