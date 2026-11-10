/**
 * Champs d'un SMS de Mobile Money (MVola, Orange Money, Airtel Money) en
 * français, malgache ou anglais : opérateur, sens, montant, frais, référence,
 * contrepartie. Formats publics, aucun modèle exact requis : mots-clés.
 */
import { normalizeText } from '../text';
import { findAmounts, type FoundAmount } from '../generic/amount';

export type SmsOperator = 'mvola' | 'orange-money' | 'airtel-money' | 'sms';

const OPERATORS: [RegExp, SmsOperator][] = [
  [/\bm\s?vola\b/, 'mvola'],
  [/\borange\s*money\b|\bom\b/, 'orange-money'],
  [/\bairtel\s*money\b|\bairtel\b/, 'airtel-money'],
];

export function operatorOf(text: string): SmsOperator {
  const t = normalizeText(text);
  for (const [re, id] of OPERATORS) if (re.test(t)) return id;
  return 'sms';
}

// Sortie d'argent : envoi, paiement, retrait, achat (fr, mg, en).
const OUT_RE = /\b(choisi|envoye|envoyee|envoi|transfere|transfert de|vous avez paye|paiement|payment|achat|retrait|retire|nandefa|nandoa|nanala|nisintona|nividy|fandoavana|fandefasana|sent|paid|withdrawn|withdrawal|purchase|debit(?:e|ee)?)\b/;
// Entrée d'argent : réception, dépôt (fr, mg, en).
const IN_RE = /\b(recu|recue|reception|nahazo|voaray|noraisina|depot|versement|received|deposit|credite|creditee)\b/;
const FEE_CTX = /(frais|sarany|fee|fees|commission|cout)\W*$/;
const BALANCE_CTX = /(solde|balance|volanao|sisa|disponible|available)[^.]{0,30}$/;

export type SmsDirection = 'out' | 'in';

// Pas une opération faite : échec, annulation, achat seulement initié, solde insuffisant, astuces.
const NOT_OPERATION = /\b(echoue|echouee|echec|annule|annulee|initie|insuffisant|gratuits?|astuce|code de validation|code de paiement)\b/;
// Pubs et bonus promis : ignorés, sauf dans une opération réussie (« Achat … reussi … Bonus: 20 pourcent »).
const PROMO = /\b(bonus|gagnez|gagner|partager|jusqu au|hatramin|kadoa)\b/;
// Relevé de solde daté (« Le 29/10/26 a 14:03, solde MVola : … ») : pas une opération.
const BALANCE_NOTICE = /^le \d{1,2}\/\d{1,2}\/\d{2,4} a \d{1,2}[:h]\d{2},? (votre )?solde\b/;

/** SMS d'opérateur qui ne décrit pas une opération faite (pub, échec, annulation…). */
export function isNotOperation(text: string): boolean {
  const t = normalizeText(text).replace(/['’`]/g, ' ').trim();
  if (NOT_OPERATION.test(t) || BALANCE_NOTICE.test(t)) return true;
  return PROMO.test(t) && !/\breussie?\b/.test(t);
}

/** Sens de l'opération : le premier mot-clé du message l'emporte. */
export function directionOf(text: string): SmsDirection | null {
  const t = normalizeText(text).replace(/['’`]/g, ' ');
  const out = OUT_RE.exec(t);
  const inc = IN_RE.exec(t);
  if (out && (!inc || out.index < inc.index)) return 'out';
  if (inc) return 'in';
  return null;
}

export interface SmsAmounts {
  main: FoundAmount | null;
  fee: FoundAmount | null;
}

/** Montant de l'opération (le premier), frais (après « frais »), solde ignoré. */
export function amountsOf(text: string): SmsAmounts {
  let main: FoundAmount | null = null;
  let fee: FoundAmount | null = null;
  for (const a of findAmounts(text)) {
    const before = normalizeText(text.slice(Math.max(0, a.start - 40), a.start));
    if (BALANCE_CTX.test(before)) continue;
    if (FEE_CTX.test(before.slice(-20))) {
      fee = fee ?? a;
      continue;
    }
    if (!main && a.currency) main = a;
  }
  return { main: main ?? offerPrice(text), fee };
}

// Forfait sans devise : « offre NET MONTH 15 000 avec MVola », « choisi MORA 500 Votre offre ».
const OFFER_RE = /\b(?:offre|choisi)\s+(?:[A-Za-z'’]+\s+){1,3}?(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d{2,6})(?![\d.,]|\s*(?:mo|go|ko|%|ar\b|j\b))/i;

/** Prix d'un forfait cité sans devise (incertain), null sinon. */
function offerPrice(text: string): FoundAmount | null {
  const m = OFFER_RE.exec(text);
  if (!m) return null;
  const start = m.index + m[0].length - m[1].length;
  const cents = Number(m[1].replace(/\D/g, '')) * 100;
  return cents > 0 ? { cents, sign: 0, currency: null, uncertain: false, start, end: start + m[1].length } : null;
}

const REF_RE = /\b(?:ref(?:erence)?|trans(?:action)?\.?\s*[il1|]d|txn\s*id|tid|id)\s*[:.#]?\s*([A-Z0-9][A-Z0-9.\-]{5,})(?:\s(\d{1,4})(?![\d\-/:]|[.,]\d))?/i;

/** Référence opérateur (anti-doublon), null si absente. */
export function referenceOf(text: string): string | null {
  const m = REF_RE.exec(text);
  if (!m) return null;
  const ref = m[1].replace(/[.\-]+$/, '');
  // Réf MVola tout en chiffres coupée par l'OCR (« Ref: 89837309 70 ») : recollée.
  const glued = m[2] && /^\d{6,9}$/.test(ref) && (ref + m[2]).length <= 10 ? ref + m[2] : ref;
  return glued.toUpperCase();
}

// Contrepartie : après « à / de / vers / tamin'i / avy amin'i / to / from », jusqu'au numéro, à « le » ou à la ponctuation.
const PARTY_RE = /(?:\s(?:a|à|au|vers|de|par|chez|tamin'?i|tamin['’]i|amin'?i|amin['’]i|any|to|from)\s+)((?:[A-Za-zÀ-ÿ][\w'’À-ÿ-]*\s?){1,4})/;
const NOT_PARTY = /^(votre|ton|ta|vos|nouveau|le|la|l|un|une|ny|ianao|compte|solde|frais|agent|mvola|orange|airtel|ar|mga)$/i;

/** Nom de la contrepartie (sans numéro de téléphone), null si illisible. */
export function counterpartyOf(text: string): string | null {
  const noPhones = text.replace(/\+?\d[\d\s]{7,}\d/g, ' # ');
  const m = PARTY_RE.exec(noPhones);
  if (!m) return null;
  const words = m[1].trim().replace(/^[ld]['’]/i, '').split(/\s+/).filter((w) => !/^([Il1]?le|la|ny|ianao|on|at)$/i.test(w));
  const name = words.join(' ').trim();
  if (!name || NOT_PARTY.test(words[0] ?? '')) return null;
  return name.slice(0, 40);
}

// « Votre achat d'offre Orange Be connect 1,2Go de 5000Ar », « offre NET MONTH 15 000 avec MVola ».
const OFFER_NAME_RE = /\boffre\s+(?:orange\s+)?(.+?)\s+(?:de\s+)?\d[\dOo\s.,]*(?:ar\b|avec\b)/i;
const CREDIT_RE = /\bachat de credit\s+([A-Za-z]+)/i;

/** Nom de l'offre achetée (forfait, « Crédit YAS »), null sinon. */
export function offerNameOf(text: string): string | null {
  const credit = CREDIT_RE.exec(text);
  if (credit) return `Crédit ${credit[1].toUpperCase()}`;
  const m = OFFER_NAME_RE.exec(text);
  const name = m?.[1].trim() ?? '';
  return name && name.length <= 30 ? name : null;
}

// Trans id Orange Money « MP260623.1714.C02389 » / « PP261023… » : AAMMJJ après 2 lettres.
const REF_DATE_RE = /^[A-Z]{2}(\d{2})(\d{2})(\d{2})\./;

/** Date tirée de la référence Orange Money, null si elle n'en porte pas. */
export function dateOfReference(reference: string | null): string | null {
  const m = reference ? REF_DATE_RE.exec(reference) : null;
  if (!m) return null;
  const [y, mo, d] = [2000 + +m[1], +m[2], +m[3]];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${m[2]}-${m[3]}`;
}
