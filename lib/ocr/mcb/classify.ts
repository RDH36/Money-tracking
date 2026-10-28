/** Libellés MCB → type d'opération, note proposée, marchand, catégorie. */
import type { OperationKind } from '../types';
import { normalizeText } from '../text';

export type Direction = 'debit' | 'credit';

export interface LabelInfo {
  kind: OperationKind | null;
  /** Sens attendu d'après les mots-clés, null si inconnu. */
  direction: Direction | null;
  note: string;
  merchant: string | null;
  categoryHint: string | null;
}

const NOTE_MAX = 100;

// Paiement carte : « DB vente carte etrangere 482913 NETFLIX COM ».
const CARD_RE = /^db\s+vente\s+carte(?:\s+[a-z]+)?\s+\d{4,}\s+(.+)$/i;
const ATM_RE = /^retrait\s+(?:sur\s+)?(?:gab|dab)\b(?:\s+[a-z]+)?(?:\s+\d{4,})?\s*(.*)$/i;
const INCOME_RE = /\b(virement\s+re[cç]us?|salaire|versement|remboursement)\b/i;
const DEBIT_RE = /\b(virement\s+[eé]mis|frais|commission|cotisation|agios|pr[eé]l[eè]vement)\b/i;

// Mots-clés → catégorie par défaut (ids de constants/categories.ts).
const CATEGORY_RULES: [RegExp, string][] = [
  [/\b(anthropic|claude|openai|chatgpt|netflix|spotify|youtube|google|apple\.com|icloud|microsoft|canal\+?|jirama|telma|orange|airtel|starlink|abonnement|subscription)\b/, 'bills'],
  [/\b(restaurant|resto|pizza|snack|pick n eat|kfc|burger|cafe|boulangerie|shoprite|leader price|jumbo|score|carrefour|epicerie|supermarche)\b/, 'food'],
  [/\b(total ?energies|galana|jovena|shell|station|taxi|uber|yango|carburant|essence|parking|tsaradia|air madagascar)\b/, 'transport'],
  [/\b(pharmacie|clinique|hopital|medical|laboratoire)\b/, 'health'],
  [/\b(cinema|steam|playstation|xbox|nintendo|game|games)\b/, 'entertainment'],
  [/\b(ecole|universite|udemy|coursera|formation|librairie)\b/, 'education'],
  [/\b(amazon|aliexpress|temu|shein|zara)\b/, 'shopping'],
];

function clip(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > NOTE_MAX ? t.slice(0, NOTE_MAX).trim() : t;
}

export function categoryHintFor(text: string): string | null {
  const t = normalizeText(text);
  for (const [re, id] of CATEGORY_RULES) if (re.test(t)) return id;
  return null;
}

export function classifyLabel(label: string): LabelInfo {
  const text = label.replace(/\s+/g, ' ').trim();

  const card = CARD_RE.exec(text);
  if (card) {
    const merchant = clip(card[1]);
    return {
      kind: 'expense', direction: 'debit', note: merchant, merchant,
      categoryHint: categoryHintFor(merchant),
    };
  }

  const atm = ATM_RE.exec(text);
  if (atm) {
    // Retrait au distributeur : l'argent passe du compte bancaire aux espèces.
    return {
      kind: 'transfer', direction: 'debit', note: clip(`Retrait GAB ${atm[1]}`),
      merchant: null, categoryHint: null,
    };
  }

  if (INCOME_RE.test(text)) {
    const note = text
      .replace(/^virement\s+re[cç]us?\s*/i, '')
      .replace(/^banque\s+confr[eè]re\s*/i, '');
    return { kind: 'income', direction: 'credit', note: clip(note || text), merchant: null, categoryHint: null };
  }

  if (DEBIT_RE.test(text)) {
    return { kind: 'expense', direction: 'debit', note: clip(text), merchant: null, categoryHint: categoryHintFor(text) };
  }

  return { kind: null, direction: null, note: clip(text), merchant: null, categoryHint: categoryHintFor(text) };
}
