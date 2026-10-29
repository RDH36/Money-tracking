/**
 * Lecteur générique de tickets de caisse et de factures (restaurant,
 * supermarché, JIRAMA, opérateurs…) : total, date, émetteur, moyen de
 * paiement. Prudent : tout ce qui n'est pas sûr est marqué « à vérifier ».
 * Seuil de détection bas exprès : les sources précises (MCB, GAB, TPE) gagnent.
 */
import type { OcrPage, ParseResult, SourceParser, UncertainField } from '../../types';
import { categoryHintFor } from '../../mcb/classify';
import { toYmd } from '../../text';
import { byTop } from '../geometry';
import { kw } from '../keywords';
import { findDate, findIssuer, findOrderNumber, findPayment, findTotal } from './fields';

const RECEIPT_WORDS = /\b(tva|nif|stat|caissier|caisse|ticket|facture|merci|client|qte|quantite|prix)\b/;
// Restauration (le mot « eat » seul, « sur place », « a emporter »…).
const FOOD = /\b(eat|kfc|restaurant|resto|snack|pizzeria|burger|sur place|a emporter|menu|bucket)\b/;
const NOTE_MAX = 100;

function detect(page: OcrPage): number {
  const lines = byTop(page.lines);
  const total = findTotal(lines);
  if (!total) return 0;
  let score = 0.4;
  if (findDate(lines, toYmd(new Date())).date) score += 0.1;
  if (lines.some((l) => RECEIPT_WORDS.test(kw(l.text)))) score += 0.1;
  return score;
}

/** Clé stable de l'émetteur pour la référence : lettres et chiffres, 16 au plus. */
function issuerKey(issuer: string | null): string {
  return (issuer ? kw(issuer).replace(/[^a-z0-9]/g, '') : '').slice(0, 16) || 'ticket';
}

function parse(page: OcrPage, today = toYmd(new Date())): ParseResult {
  const lines = byTop(page.lines);
  const total = findTotal(lines);
  const { date, conflict } = findDate(lines, today);
  if (!total || !date) return { operations: [], partial: 1 };

  const issuer = findIssuer(lines);
  const order = findOrderNumber(lines);
  const units = Math.round(total.amount.cents / 100);
  const uncertain: UncertainField[] = [];
  if (total.amount.uncertain) uncertain.push('amount');
  if (conflict) uncertain.push('date');
  const head = lines.slice(0, 8).map((l) => l.text).join(' ');
  const note = (issuer ?? 'Ticket de caisse').slice(0, NOTE_MAX);
  const categoryHint = categoryHintFor(`${issuer ?? ''} ${head}`)
    ?? (FOOD.test(kw(lines.map((l) => l.text).join(' '))) ? 'food' : null);

  return {
    operations: [{
      source: 'receipt',
      reference: `${issuerKey(issuer)}-${date}-${order ?? units}`,
      date,
      label: note,
      note,
      amount: -total.amount.cents,
      currency: 'MGA',
      kind: 'expense',
      merchant: issuer,
      categoryHint,
      uncertain,
      payment: findPayment(lines),
    }],
    partial: 0,
  };
}

export const receiptParser: SourceParser = {
  id: 'receipt', label: 'Ticket de caisse', detect, parse: (page) => parse(page), ticket: true,
};
export { parse as parseReceipt };
