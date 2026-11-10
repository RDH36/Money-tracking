/**
 * « Coller un SMS » : un ou plusieurs SMS de Mobile Money collés d'un coup →
 * opérations à vérifier (même écran que les captures). Pur, testable sous Node.
 *
 * Frais : opération de DÉPENSE SÉPARÉE (« Frais MVola »), pas ajoutée au
 * montant : le montant principal reste celui que la contrepartie a reçu
 * (comparable à son reçu, à un ticket), et les frais restent visibles et
 * décochables à la vérification.
 */
import type { ParsedOperation, UncertainField } from '../types';
import { toYmd } from '../text';
import { categoryHintFor } from '../mcb/classify';
import { dateInText } from '../generic/dates';
import {
  amountsOf, counterpartyOf, directionOf, isNotOperation, operatorOf, referenceOf, type SmsOperator,
} from './fields';

export interface SmsReading {
  operations: ParsedOperation[];
  /** Nombre de SMS trouvés dans le texte collé. */
  messages: number;
  /** SMS dont une opération a été tirée. */
  recognized: number;
}

const OPERATOR_NAMES: Record<SmsOperator, string> = {
  mvola: 'MVola', 'orange-money': 'Orange Money', 'airtel-money': 'Airtel Money', sms: 'Mobile Money',
};
const NOTE_MAX = 100;
// Début probable d'un nouveau SMS sur une ligne : « 1/2 », mot de transaction suivi d'un montant.
const HAS_AMOUNT = /\d[\d\s.,]*\s*(ar|mga|ariary)\b/i;

/**
 * Découpe le texte collé en SMS : lignes vides, puis lignes qui portent
 * chacune leur propre opération (SMS collés sans ligne vide entre eux).
 */
export function splitMessages(text: string): string[] {
  const chunks = text.replace(/\r/g, '').split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const out: string[] = [];
  for (const chunk of chunks) {
    let current: string[] = [];
    for (const line of chunk.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const opens = HAS_AMOUNT.test(line) && directionOf(line) !== null;
      const hasOp = current.some((l) => HAS_AMOUNT.test(l) && directionOf(l) !== null);
      if (opens && hasOp) {
        out.push(current.join(' '));
        current = [];
      }
      current.push(line);
    }
    if (current.length) out.push(current.join(' '));
  }
  return out;
}

function clip(s: string): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX).trim();
}

/** Opérations d'un SMS (principale + frais), vide si ce n'est pas une opération. */
export function parseSms(
  sms: string, today = toYmd(new Date()), dayDate?: string | null, operatorHint?: SmsOperator,
): ParsedOperation[] {
  if (isNotOperation(sms)) return [];
  const direction = directionOf(sms);
  const { main, fee } = amountsOf(sms);
  if (!direction || !main) return [];
  // Capture : le nom du contact (« OrangeMoney ») donne l'opérateur si le SMS ne le cite pas.
  const named = operatorOf(sms);
  const operator = named === 'sms' && operatorHint ? operatorHint : named;
  const name = OPERATOR_NAMES[operator];
  const reference = referenceOf(sms);
  // Date du SMS, sinon l'en-tête de jour de l'appli Messages (capture), sinon aujourd'hui.
  const textDate = dateInText(sms, today) ?? dayDate ?? null;
  const date = textDate ?? today;
  const party = counterpartyOf(sms);
  const debit = direction === 'out';
  const uncertain: UncertainField[] = [];
  if (main.uncertain) uncertain.push('amount');
  if (!textDate) uncertain.push('date');
  if (!reference) uncertain.push('reference');
  const note = clip(party ? `${name} · ${party}` : name);
  const base = {
    source: operator, date, currency: 'MGA', merchant: party, payment: null, uncertain,
  };
  const ops: ParsedOperation[] = [{
    ...base,
    reference,
    label: clip(sms),
    note,
    amount: debit ? -main.cents : main.cents,
    kind: debit ? 'expense' : 'income',
    categoryHint: debit ? categoryHintFor(sms.replace(/orange|airtel/gi, ' ')) : null,
  }];
  if (fee && fee.cents > 0) {
    ops.push({
      ...base,
      reference: reference ? `${reference}-FRAIS` : null,
      label: clip(`Frais ${name}`),
      note: clip(`Frais ${name}`),
      merchant: null,
      amount: -fee.cents,
      kind: 'expense',
      categoryHint: 'bills',
      fixedCategory: true,
      uncertain: uncertain.filter((f) => f !== 'amount'),
    });
  }
  return ops;
}

/** Tout le texte collé : chaque SMS reconnu donne ses opérations (image 0 = une lecture). */
export function readSmsText(text: string, today = toYmd(new Date())): SmsReading {
  const messages = splitMessages(text);
  const operations: ParsedOperation[] = [];
  let recognized = 0;
  for (const sms of messages) {
    const ops = parseSms(sms, today);
    if (ops.length === 0) continue;
    recognized++;
    operations.push(...ops.map((op) => ({ ...op, image: 0 })));
  }
  return { operations, messages: messages.length, recognized };
}
