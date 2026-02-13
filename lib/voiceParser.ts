export interface ParsedVoiceInput {
  amount: number; // display value, NOT cents
  type: 'expense' | 'income';
  categoryId: string | null;
  note: string | null;
}

// Category synonym map for fuzzy matching (multi-language)
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'food': ['nourriture', 'manger', 'sakafo', 'repas', 'restaurant', 'food', 'eat', 'déjeuner', 'dîner', 'petit-déjeuner', 'hoana'],
  'transport': ['transport', 'taxi', 'voiture', 'fitaterana', 'fiara', 'uber', 'essence', 'carburant'],
  'shopping': ['shopping', 'achat', 'course', 'courses', 'fiantsenana', 'vidy'],
  'bills': ['facture', 'factures', 'faktiora', 'bills', 'loyer', 'électricité', 'rano', 'jiro', 'internet', 'téléphone'],
  'health': ['santé', 'médecin', 'pharmacie', 'fahasalamana', 'health', 'doctor', 'hopitaly', 'fanafody'],
  'entertainment': ['loisir', 'loisirs', 'fialam-boly', 'lalao', 'entertainment', 'cinema', 'sortie'],
  'education': ['éducation', 'école', 'formation', 'fanabeazana', 'sekoly', 'education', 'school', 'cours', 'livre'],
  'other': ['autre', 'divers', 'hafa', 'other'],
};

// Keywords that indicate income vs expense
const INCOME_KEYWORDS = ['revenu', 'revenue', 'salaire', 'salary', 'income', 'vola miditra', 'karama', 'reçu', 'received', 'gagné'];

// Words to remove before category matching
const FILLER_WORDS = ['ariary', 'mga', 'euro', 'euros', 'dollar', 'dollars', 'ajoute', 'ajouter', 'add', 'dépense', 'depense', 'hampiditra', 'pour', 'for'];

/** Check if a word appears as a standalone token (space-separated) */
function matchesWord(text: string, word: string): boolean {
  const words = text.split(/\s+/);
  return words.some(w => w === word);
}

/** Remove all occurrences of a word from text (space-separated tokens) */
function removeWord(text: string, word: string): string {
  return text.split(/\s+/).filter(w => w !== word).join(' ').trim();
}

export function parseVoiceInput(text: string): ParsedVoiceInput | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  // Detect income/expense type
  const isIncome = INCOME_KEYWORDS.some(kw => normalized.includes(kw));
  const type = isIncome ? 'income' : 'expense';

  // Extract amount - find first number sequence
  const amountMatch = normalized.match(/(\d[\d\s]*(?:[.,]\d+)?)/);
  if (!amountMatch) return null;
  const amountStr = amountMatch[1].replace(/\s/g, '').replace(',', '.');
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return null;

  // Remove amount from text, then clean up
  let searchText = normalized.replace(amountMatch[0], '').replace(/\s+/g, ' ').trim();

  // Remove filler words and short currency codes (token-based, not substring)
  for (const filler of [...FILLER_WORDS, 'ar', 'de']) {
    searchText = removeWord(searchText, filler);
  }
  // Remove income keywords
  for (const kw of INCOME_KEYWORDS) {
    if (kw.includes(' ')) {
      searchText = searchText.replace(kw, '').trim();
    } else {
      searchText = removeWord(searchText, kw);
    }
  }
  searchText = searchText.replace(/\s+/g, ' ').trim();

  // Match category using token-based matching for short words, includes for longer
  let categoryId: string | null = null;
  for (const [catId, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const synonym of synonyms) {
      const matched = synonym.length <= 4
        ? matchesWord(searchText, synonym)
        : searchText.includes(synonym);
      if (matched) {
        categoryId = catId;
        searchText = synonym.length <= 4
          ? removeWord(searchText, synonym)
          : searchText.replace(synonym, '').trim();
        break;
      }
    }
    if (categoryId) break;
  }

  // Remaining text becomes note (max 20 chars)
  searchText = searchText.replace(/\s+/g, ' ').trim();
  const note = searchText.length > 0 ? searchText.slice(0, 20) : null;

  return { amount, type, categoryId, note };
}

/**
 * Parse multiple comma-separated entries (e.g. "20000 nourriture, 5000 loisir")
 * Returns array of valid parsed items (invalid entries are skipped)
 */
export function parseMultipleInputs(text: string): ParsedVoiceInput[] {
  if (!text.trim()) return [];

  const segments = text.split(',').map(s => s.trim()).filter(Boolean);
  const results: ParsedVoiceInput[] = [];

  for (const segment of segments) {
    const parsed = parseVoiceInput(segment);
    if (parsed) results.push(parsed);
  }

  return results;
}
