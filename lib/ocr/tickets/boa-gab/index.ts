/**
 * Ticket de retrait au distributeur Bank of Africa (« RETRAIT D'ARGENT »).
 * Montants au format US (« 60,000.00 MGA »), date « 14-03-26 » sur la ligne
 * « TRAN DATE HEURE GAB ». Retrait = transfert banque → espèces.
 */
import type { OcrLine, OcrPage, ParsedOperation, ParseResult, SourceParser, UncertainField } from '../../types';
import { isAmountOnly, parseTicketAmount, type TicketAmount } from '../amount';
import { findDates } from '../dates';
import { byTop, centerY, lineHeight, pairByRow, ticketColumn } from '../geometry';
import { afterLabel, digitsOf, kw } from '../keywords';

const BRAND = /\bbank of africa\b/;
const RETRAIT = /retra[il1i]t d ?argent/;
const FRAIS = /montant fra[il1i]s/;
const DEBITE = /montant deb[il1i]te/;
const AUTH = /autor[il1i]?[sz]ation/;
const TRAN_HEADER = /tran date/;
// « 4127 14-03-26 08:12:40 20004417 » : n° de transaction, date, heure, n° du GAB.
const TRAN_RE = /(\d{3,6})\s+(\d{2}-\d{2}-\d{2,4})\s+\d{2}[:.]\d{2}[:.]\d{2}(?:\s+(\d{6,10}))?/;

const EMPTY: ParseResult = { operations: [], partial: 0 };

function detect(page: OcrPage): number {
  let score = 0;
  const texts = page.lines.map((l) => kw(l.text));
  if (texts.some((t) => BRAND.test(t))) score += 0.4;
  if (texts.some((t) => RETRAIT.test(t))) score += 0.3;
  if (texts.some((t) => TRAN_HEADER.test(t)) || page.lines.some((l) => TRAN_RE.test(digitsLine(l.text)))) score += 0.2;
  if (texts.some((t) => AUTH.test(t))) score += 0.1;
  return score;
}

function digitsLine(text: string): string {
  return text.replace(/(?<=\d)[Oo]|[Oo](?=\d)/g, '0');
}

/** Montant écrit après le libellé, ou à droite sur sa propre ligne (ticket incliné). */
function readAmounts(lines: OcrLine[], labels: (OcrLine | undefined)[]): (TicketAmount | null)[] {
  const values = labels.map((l) => {
    if (!l) return null;
    const rest = afterLabel(l.text, /montant \w+|argent/);
    return /\d/.test(rest) ? parseTicketAmount(rest) : null;
  });
  const missing = labels.filter((l, i): l is OcrLine => !!l && values[i] === null);
  if (missing.length > 0) {
    const top = Math.min(...missing.map((l) => l.top)) - lineHeight(missing[0]) * 2;
    const bottom = Math.max(...missing.map((l) => l.bottom)) + lineHeight(missing[0]) * 2;
    const minLeft = Math.min(...missing.map((l) => l.right)) - lineHeight(missing[0]);
    const candidates = lines.filter(
      (l) => isAmountOnly(l.text) && centerY(l) >= top && centerY(l) <= bottom && l.left >= minLeft
    );
    const paired = pairByRow(missing, candidates);
    missing.forEach((l, k) => {
      const v = paired[k];
      values[labels.indexOf(l)] = v ? parseTicketAmount(v.text) : null;
    });
  }
  return values;
}

function parse(page: OcrPage): ParseResult {
  const brands = page.lines.filter((l) => BRAND.test(kw(l.text)));
  // Aucun ou plusieurs tickets sur la photo : rien d'affiché plutôt qu'un mélange.
  if (brands.length !== 1) return EMPTY;
  const lines = byTop(ticketColumn(page.lines, brands[0]));
  const find = (re: RegExp) => lines.find((l) => re.test(kw(l.text)));
  if (lines.filter((l) => RETRAIT.test(kw(l.text))).length !== 1) return EMPTY;

  const tranLine = lines.find((l) => TRAN_RE.test(digitsLine(l.text)));
  const tran = tranLine ? TRAN_RE.exec(digitsLine(tranLine.text)) : null;
  const uncertain: UncertainField[] = [];
  let date = tran ? findDates(tran[2])[0] ?? null : null;
  if (!date) {
    date = lines.map((l) => findDates(l.text)[0]).find(Boolean) ?? null;
    uncertain.push('date');
  }
  let gab = tran?.[3] ?? null;
  if (tran && !gab && tranLine) {
    // N° du GAB parfois lu comme une ligne à part, au bout de la ligne.
    gab = lines.find((l) => l.left > tranLine.left && Math.abs(centerY(l) - centerY(tranLine)) < lineHeight(tranLine)
      && /^\d{6,10}$/.test(digitsOf(l.text)) && l.text.replace(/\s/g, '').length <= 10)?.text.replace(/\s/g, '') ?? null;
  }

  const [retrait, frais, debite] = readAmounts(lines, [find(RETRAIT), find(FRAIS), find(DEBITE)]);
  if (!date || !retrait || retrait.cents === 0) return { operations: [], partial: 1 };
  const fees = frais?.cents ?? 0;
  const confirmed = !!debite && debite.cents === retrait.cents + fees;
  if (retrait.uncertain || !confirmed) uncertain.push('amount');

  const authLine = find(AUTH);
  const auth = authLine ? digitsOf(afterLabel(authLine.text, AUTH)) : '';
  const reference = tran && auth.length >= 6 ? [gab, tran[1], auth].filter(Boolean).join('-') : null;
  if (!reference) uncertain.push('reference');

  const note = `Retrait GAB BOA${gab ? ` ${gab}` : ''}`;
  const base = { source: 'boa-gab', date, currency: 'MGA', merchant: null, payment: null } as const;
  const operations: ParsedOperation[] = [{
    ...base, reference, label: note, note, amount: -retrait.cents, kind: 'transfer', categoryHint: null, uncertain,
  }];
  if (fees > 0) {
    // Frais du distributeur : une dépense à part sur le compte bancaire.
    operations.push({
      ...base, reference: reference ? `${reference}-frais` : null, label: `Frais ${note}`, note: `Frais ${note}`,
      amount: -fees, kind: 'expense', categoryHint: null, uncertain: frais?.uncertain ? ['amount'] : [],
    });
  }
  return { operations, partial: 0 };
}

export const boaGabParser: SourceParser = { id: 'boa-gab', label: 'Ticket GAB BOA', detect, parse, ticket: true };
