/**
 * Champs d'un ticket de caisse ou d'une facture, quel que soit l'émetteur :
 * total à payer, dates, émetteur (en-tête), n° de commande, moyen de paiement.
 */
import type { OcrLine } from '../../types';
import { isAmountOnly, parseTicketAmount, type TicketAmount } from '../amount';
import { centerY, lineHeight, rightOf } from '../geometry';
import { afterLabel, digitsOf, kw, letterRatio } from '../keywords';
import { findDates } from '../dates';

// Mots-clés du total, du plus fiable au moins fiable.
const TOTAL_RULES: RegExp[] = [
  /net a payer/,
  /total (a payer|ttc|general|net)\b/,
  /montant (ttc|a payer|total|net)\b/,
  /reste a payer/,
  /montant du\b/,
  /\ba payer\b/,
  /\btotal\b/,
];
const NOT_TOTAL = /sous ?-? ?total|total (ht|tva|remise|articles?)\b|\bht\b/;

export interface TotalField {
  line: OcrLine;
  amount: TicketAmount;
}

/** Montant écrit sur la ligne du libellé, sinon la valeur la plus proche à droite. */
export function amountBeside(label: OcrLine, lines: OcrLine[], keyword: RegExp): TicketAmount | null {
  const inline = afterLabel(label.text, keyword);
  if (/\d/.test(inline)) {
    const a = parseTicketAmount(inline);
    if (a) return a;
  }
  let best: OcrLine | null = null;
  let gap = lineHeight(label) * 0.8;
  for (const v of rightOf(label, lines)) {
    const g = Math.abs(centerY(v) - centerY(label));
    if (isAmountOnly(v.text) && g <= gap) {
      best = v;
      gap = g;
    }
  }
  const amount = best ? parseTicketAmount(best.text) : null;
  if (!amount) return null;
  // Valeur décalée de plus d'une demi-ligne : ticket incliné, à vérifier.
  return gap > lineHeight(label) * 0.45 ? { ...amount, uncertain: true } : amount;
}

export function findTotal(lines: OcrLine[]): TotalField | null {
  for (const rule of TOTAL_RULES) {
    const labels = lines.filter((l) => rule.test(kw(l.text)) && !NOT_TOTAL.test(kw(l.text)));
    // Plusieurs « TOTAL » : le dernier est le total général.
    for (const line of [...labels].reverse()) {
      const amount = amountBeside(line, lines, rule);
      if (amount && amount.cents > 0) return { line, amount };
    }
  }
  return null;
}

const CARD = /credit card|debit card|\bcard\b|\bcarte\b|\bcb\b|\bvisa\b|mastercard|\btpe\b/;
const CASH = /espece|\bcash\b|liquide|comptant/;

/**
 * Moyen de paiement : carte ou espèces lus sur le ticket. Aucun des deux :
 * espèces (un ticket papier sans mention de carte est presque toujours payé
 * en liquide). Les deux à la fois : inconnu (compte bancaire proposé).
 */
export function findPayment(lines: OcrLine[]): 'card' | 'cash' | null {
  const text = lines.map((l) => kw(l.text)).join(' | ');
  const card = CARD.test(text);
  const cash = CASH.test(text);
  if (card && cash) return null;
  return card ? 'card' : 'cash';
}

/** Première date lisible (en haut du ticket) et s'il y en a d'autres qui la contredisent. */
export function findDate(lines: OcrLine[], today: string): { date: string | null; conflict: boolean } {
  const dates = lines.flatMap((l) => findDates(l.text)).filter((d) => d <= today);
  if (dates.length === 0) return { date: null, conflict: false };
  return { date: dates[0], conflict: dates.some((d) => d !== dates[0]) };
}

const NOT_ISSUER = /^(ticket|facture|recu|caisse|bienvenue|welcome|duplicata|copie)\b/;

/** Émetteur : la 1re ligne de texte du ticket et ce qui est sur la même rangée. */
export function findIssuer(lines: OcrLine[]): string | null {
  const first = lines.find((l) => letterRatio(l.text) >= 0.6 && /[a-z]{3,}/.test(kw(l.text))
    && !NOT_ISSUER.test(kw(l.text)) && findDates(l.text).length === 0);
  if (!first) return null;
  const row = lines
    .filter((l) => Math.abs(centerY(l) - centerY(first)) <= lineHeight(first) * 0.8 && letterRatio(l.text) >= 0.6)
    .sort((a, b) => a.left - b.left);
  return row.map((l) => l.text.trim()).join(' ').replace(/[^\p{L}\p{N}&' .-]/gu, '').replace(/\s+/g, ' ').trim() || null;
}

const ORDER = /(commande|order|ticket|facture|recu)\b.*\b(n|no|num|numero)\b|\b(n|no|num|numero)\b.*(commande|order|ticket|facture|recu)\b/;

/** N° de commande / de ticket / de facture : sur la ligne ou juste en dessous. */
export function findOrderNumber(lines: OcrLine[]): string | null {
  const label = lines.find((l) => ORDER.test(kw(l.text)));
  if (!label) return null;
  const inline = digitsOf(afterLabel(label.text, ORDER));
  if (inline.length >= 2 && inline.length <= 12) return inline;
  const next = lines.find((l) => l.top >= label.top + lineHeight(label) * 0.5
    && l.top - label.bottom <= lineHeight(label) * 1.5 && /^[\d\s]{2,12}$/.test(l.text.trim()));
  return next ? next.text.replace(/\s/g, '') : null;
}
