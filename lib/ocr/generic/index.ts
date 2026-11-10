/**
 * Lecteur GÉNÉRIQUE des relevés à l'écran (captures, photos) : n'importe
 * quelle banque ou appli, sans parseur dédié. Montant (devise, signe,
 * couleur, mots débit/crédit), date (en-tête de jour ou date du libellé),
 * libellé (lignes regroupées autour du montant). Soldes ignorés. Tout ce qui
 * est deviné est marqué « à vérifier ». Placé après les parseurs dédiés et
 * avant le ticket de caisse (un seul total) dans le registre.
 */
import type { OcrPage, ParsedOperation, ParseResult, SourceParser, UncertainField } from '../types';
import { isGreenish, normalizeText, toYmd } from '../text';
import { classifyLabel } from '../mcb/classify';
import { byTop } from '../tickets/geometry';
import { findTotal } from '../tickets/receipt/fields';
import { kw } from '../tickets/keywords';
import { dateInText } from './dates';
import { layoutPage, type AmountRow } from './layout';

export const GENERIC_SOURCE = 'generic';
const NOTE_MAX = 100;

const DEBIT_WORDS = /\b(debit|retrait|paiement|achat|envoi|envoye|transfert vers|frais|cotisation|commission|prelevement|facture|withdrawal|payment|purchase|sent|fee)\b/;
const CREDIT_WORDS = /\b(credit|recu|recus|reception|versement|depot|salaire|remboursement|virement recu|received|deposit|salary|refund)\b/;
const isReddish = (hex: string | null | undefined): boolean => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  return r > parseInt(hex.slice(3, 5), 16) + 60 && r > parseInt(hex.slice(5, 7), 16) + 40;
};

/** Sens : signe lu, puis mots-clés du libellé, puis couleur ; sinon dépense « à vérifier ». */
export function directionOf(sign: -1 | 0 | 1, label: string, color?: string | null): { debit: boolean; sure: boolean } {
  if (sign !== 0) return { debit: sign < 0, sure: true };
  const t = normalizeText(label);
  const debit = DEBIT_WORDS.exec(t);
  const credit = CREDIT_WORDS.exec(t);
  if (debit && (!credit || debit.index <= credit.index)) return { debit: true, sure: !credit };
  if (credit) return { debit: false, sure: !debit };
  if (isGreenish(color)) return { debit: false, sure: true };
  if (isReddish(color)) return { debit: true, sure: true };
  return { debit: true, sure: false };
}

function clip(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/(\s*(\.{3}|…))+$/, '').trim().slice(0, NOTE_MAX).trim();
}

function toOperation(row: AmountRow, today: string): ParsedOperation {
  const parts = [row.inlineLabel, ...row.labels.map((l) => l.text.trim())].filter(Boolean);
  const label = clip(parts.join(' '));
  const title = clip(parts[0] ?? label);
  const info = classifyLabel(label);
  const { debit, sure } = directionOf(row.amount.sign, label, row.line.color);
  const kind = info.kind === 'transfer' && debit ? 'transfer' : debit ? 'expense' : 'income';
  const textDate = dateInText(label, today);
  const date = textDate ?? row.headerDate ?? today;

  const uncertain: UncertainField[] = [];
  if (row.amount.uncertain) uncertain.push('amount');
  if (!sure) uncertain.push('sign');
  if (!textDate && !row.headerDate) uncertain.push('date');
  // Note : le titre de la carte (1re ligne), plus lisible que le libellé entier.
  const note = info.merchant ? info.note : title;
  return {
    source: GENERIC_SOURCE,
    reference: null,
    date,
    label,
    note: clip(note) || title,
    amount: debit ? -row.amount.cents : row.amount.cents,
    currency: row.amount.currency ?? 'MGA',
    kind,
    merchant: info.merchant,
    categoryHint: kind === 'expense' ? info.categoryHint : null,
    uncertain,
  };
}

// Mots propres aux tickets et factures papier (jamais sur un relevé à l'écran).
const RECEIPT_MARKS = /\b(nif|stat|tva|caissier|caisse|qte|quantite|sous[- ]total|ticket|commande|sur place|a emporter)\b/;

/** Un ticket de caisse (total, NIF, caissier…) reste au lecteur de tickets, même sans total lu. */
function looksLikeReceipt(page: OcrPage): boolean {
  if (page.lines.some((l) => RECEIPT_MARKS.test(kw(l.text)))) return true;
  return findTotal(byTop(page.lines)) !== null;
}

export function parseGeneric(page: OcrPage, today = toYmd(new Date())): ParseResult {
  const { rows, partial } = layoutPage(page, today);
  return { operations: rows.map((r) => toOperation(r, today)), partial };
}

/** Confiance : au moins deux opérations lues (repli, après les sources dédiées). */
function detect(page: OcrPage): number {
  if (looksLikeReceipt(page)) return 0;
  const { rows } = layoutPage(page, toYmd(new Date()));
  if (rows.length < 2) return 0;
  return Math.min(0.58, 0.5 + rows.length * 0.01);
}

export const genericParser: SourceParser = {
  id: GENERIC_SOURCE, label: 'Relevé', detect, parse: (page) => parseGeneric(page), fallback: true,
};
