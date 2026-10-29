/**
 * Ticket de paiement par carte d'un terminal BMOI (« VISA ACHAT DEBIT »).
 * Montant « 48 700.00 MGA », date « 21/03/26 », marchand sous le n° de
 * terminal, n° d'autorisation et STAN dans la colonne de droite. La carte
 * peut être d'une autre banque : le compte proposé est le compte bancaire
 * de l'utilisateur, pas BMOI.
 */
import type { OcrLine, OcrPage, ParseResult, SourceParser, UncertainField } from '../../types';
import { categoryHintFor } from '../../mcb/classify';
import { isAmountOnly, parseTicketAmount } from '../amount';
import { findDates } from '../dates';
import { byTop, centerY, lineHeight, pairByRow, rightOf, ticketColumn } from '../geometry';
import { afterLabel, digitsOf, fixWords, kw, letterRatio } from '../keywords';

const BRAND = /\bbmoi\b|malgache de|ocean indien/;
const ACHAT = /\bachat\b/;
const STAN = /\bstan\b/;
const AUTH = /num autor|autor ?[il1i]? ?[sz]ation/;
const NETWORK = /\b(visa|mastercard)\b/;
const REFUND = /annulation|rembours/;
// Fin du bloc marchand : identifiant d'appli carte, nom de la carte, banque du client.
const MERCHANT_END = /^(app|client|a0{4,})|visa debit|^a\d{6,}/;

const EMPTY: ParseResult = { operations: [], partial: 0 };

function detect(page: OcrPage): number {
  const texts = page.lines.map((l) => kw(l.text));
  let score = 0;
  if (texts.some((t) => BRAND.test(t))) score += 0.4;
  if (texts.some((t) => ACHAT.test(t))) score += 0.2;
  if (texts.some((t) => STAN.test(t) || AUTH.test(t))) score += 0.3;
  if (texts.some((t) => NETWORK.test(t))) score += 0.1;
  return score;
}

/** N° (autorisation, STAN) : après le libellé, sinon nombre de 6 chiffres en face. */
function readCodes(lines: OcrLine[], labels: (OcrLine | undefined)[]): (string | null)[] {
  const codes = labels.map((l) => {
    if (!l) return null;
    const d = digitsOf(afterLabel(l.text, /stan|sation/));
    return d.length >= 6 ? d : null;
  });
  const missing = labels.filter((l, i): l is OcrLine => !!l && codes[i] === null);
  if (missing.length === 0) return codes;
  const h = lineHeight(missing[0]);
  const top = Math.min(...missing.map((m) => m.top)) - h * 2;
  const bottom = Math.max(...missing.map((m) => m.bottom)) + h * 2;
  const candidates = lines.filter((l) => /^\d{6}$/.test(l.text.replace(/\s/g, ''))
    && centerY(l) >= top && centerY(l) <= bottom && missing.some((m) => rightOf(m, [l]).length > 0));
  const paired = pairByRow(missing, candidates);
  missing.forEach((l, k) => {
    codes[labels.indexOf(l)] = paired[k] ? paired[k]!.text.replace(/\s/g, '') : null;
  });
  return codes;
}

function readAmount(lines: OcrLine[]): { cents: number; uncertain: boolean } | null {
  const withCurrency = lines.filter((l) => /\bMGA\b/.test(l.text) && /\d/.test(l.text));
  if (withCurrency.length === 1) return parseTicketAmount(afterLabel(withCurrency[0].text, /montant/) || withCurrency[0].text);
  const label = lines.find((l) => /^montant\b/.test(kw(l.text)));
  if (!label) return null;
  const inline = afterLabel(label.text, /montant/);
  if (/\d/.test(inline)) return parseTicketAmount(inline);
  const [value] = pairByRow([label], rightOf(label, lines).filter((l) => isAmountOnly(l.text)));
  const amount = value ? parseTicketAmount(value.text) : null;
  return amount ? { ...amount, uncertain: true } : null;
}

function readMerchant(lines: OcrLine[], dateLine: OcrLine): { merchant: string | null; place: string | null } {
  const below = lines.filter((l) => centerY(l) > dateLine.bottom && l.left < dateLine.right + lineHeight(dateLine) * 2);
  const words: string[] = [];
  for (const l of below) {
    const t = kw(l.text);
    if (MERCHANT_END.test(t)) break;
    if (letterRatio(l.text) >= 0.5 && /[a-z]{2,}/.test(t)) words.push(fixWords(l.text));
    if (words.length === 2) break;
  }
  return { merchant: words[0] ?? null, place: words[1] ?? null };
}

function parse(page: OcrPage): ParseResult {
  const brands = page.lines.filter((l) => BRAND.test(kw(l.text)));
  const count = (re: RegExp) => page.lines.filter((l) => re.test(kw(l.text))).length;
  // Deux tickets (ou deux copies) sur la photo : rien plutôt qu'un mélange.
  if (brands.length === 0 || count(ACHAT) > 1 || count(STAN) > 1) return EMPTY;
  const anchor = brands.reduce((a, b) => (b.right - b.left > a.right - a.left ? b : a));
  const lines = byTop(ticketColumn(page.lines, anchor));
  if (lines.some((l) => REFUND.test(kw(l.text)))) return EMPTY;

  const dateLine = lines.find((l) => findDates(l.text).length > 0);
  const amount = readAmount(lines);
  if (!dateLine || !amount || amount.cents === 0) return { operations: [], partial: 1 };
  const date = findDates(dateLine.text)[0];

  const uncertain: UncertainField[] = [];
  if (amount.uncertain) uncertain.push('amount');
  if (!lines.some((l) => ACHAT.test(kw(l.text)))) uncertain.push('sign');
  const find = (re: RegExp) => lines.find((l) => re.test(kw(l.text)));
  const [auth, stan] = readCodes(lines, [find(AUTH), find(STAN)]);
  const reference = auth || stan ? [auth, stan].filter(Boolean).join('-') : null;
  if (!auth || !stan) uncertain.push('reference');

  const { merchant, place } = readMerchant(lines, dateLine);
  const label = [merchant, place].filter(Boolean).join(' ') || 'Paiement carte';
  const note = merchant ?? 'Paiement carte';
  return {
    operations: [{
      source: 'bmoi-tpe', reference, date, label, note, amount: -amount.cents, currency: 'MGA',
      kind: 'expense', merchant, categoryHint: categoryHintFor(label), uncertain, payment: 'card',
    }],
    partial: 0,
  };
}

export const bmoiTpeParser: SourceParser = { id: 'bmoi-tpe', label: 'Ticket carte BMOI', detect, parse, ticket: true };
