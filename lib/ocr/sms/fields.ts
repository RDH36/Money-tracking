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
const OUT_RE = /\b(envoye|envoyee|envoi|transfere|transfert de|vous avez paye|paiement|payment|achat|retrait|retire|nandefa|nandoa|nanala|nisintona|nividy|fandoavana|fandefasana|sent|paid|withdrawn|withdrawal|purchase|debit(?:e|ee)?)\b/;
// Entrée d'argent : réception, dépôt (fr, mg, en).
const IN_RE = /\b(recu|recue|reception|nahazo|voaray|noraisina|depot|versement|received|deposit|credite|creditee)\b/;
const FEE_CTX = /(frais|sarany|fee|fees|commission|cout)\W*$/;
const BALANCE_CTX = /(solde|balance|volanao|sisa|disponible|available)[^.]{0,30}$/;

export type SmsDirection = 'out' | 'in';

// Pas une opération faite : échec, annulation, achat seulement initié, pubs et bonus promis.
const NOT_OPERATION = /\b(echoue|echouee|echec|annule|annulee|initie|bonus|gagnez|partager|jusqu au|hatramin|kadoa|code de validation|code de paiement)\b/;

/** SMS d'opérateur qui ne décrit pas une opération faite (pub, échec, annulation…). */
export function isNotOperation(text: string): boolean {
  return NOT_OPERATION.test(normalizeText(text).replace(/['’`]/g, ' '));
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
  return { main, fee };
}

const REF_RE = /\b(?:ref(?:erence)?|trans(?:action)?\.?\s*id|txn\s*id|tid|id)\s*[:.#]?\s*([A-Z0-9][A-Z0-9.\-]{5,})/i;

/** Référence opérateur (anti-doublon), null si absente. */
export function referenceOf(text: string): string | null {
  const m = REF_RE.exec(text);
  return m ? m[1].replace(/[.\-]+$/, '').toUpperCase() : null;
}

// Contrepartie : après « à / de / vers / tamin'i / avy amin'i / to / from », jusqu'au numéro, à « le » ou à la ponctuation.
const PARTY_RE = /(?:\s(?:a|à|au|vers|de|par|chez|tamin'?i|tamin['’]i|amin'?i|amin['’]i|any|to|from)\s+)((?:[A-Za-zÀ-ÿ][\w'’À-ÿ-]*\s?){1,4})/;
const NOT_PARTY = /^(votre|ton|ta|vos|nouveau|le|la|l|un|une|ny|ianao|compte|solde|frais|agent|mvola|orange|airtel|ar|mga)$/i;

/** Nom de la contrepartie (sans numéro de téléphone), null si illisible. */
export function counterpartyOf(text: string): string | null {
  const noPhones = text.replace(/\+?\d[\d\s]{7,}\d/g, ' # ');
  const m = PARTY_RE.exec(noPhones);
  if (!m) return null;
  const words = m[1].trim().replace(/^[ld]['’]/i, '').split(/\s+/).filter((w) => !/^(le|la|ny|ianao|on|at)$/i.test(w));
  const name = words.join(' ').trim();
  if (!name || NOT_PARTY.test(words[0] ?? '')) return null;
  return name.slice(0, 40);
}
