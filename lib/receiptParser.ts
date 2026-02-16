import type { ReceiptData, ReceiptLineItem } from '@/types';

const TOTAL_KEYWORDS = [
  'total', 'montant', 'amount', 'net', 'ttc', 'a payer',
  'to pay', 'due', 'sum', 'grand total', 'total ttc',
  'sous-total', 'subtotal', 'total general', 'prix', 'price',
];

/**
 * Normalize an amount string to a plain number string.
 * "45 000" → "45000", "1,234.56" → "1234.56", "42,50" → "42.50"
 */
function normalizeAmount(raw: string): string {
  return raw.replace(/\s/g, '').replace(',', '.');
}

/**
 * Extract the first amount found on a line.
 * Supports: space-separated (45 000), decimals (42.50, 42,50), plain integers (45000).
 */
function extractLineAmount(line: string): string | null {
  const patterns = [
    /(\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2})/,
    /(\d+[.,]\d{1,2})/,
    /(\d{1,3}(?:\s\d{3})+)/,
    /\b(\d{3,7})\b/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const value = parseFloat(normalizeAmount(match[1]));
      if (value >= 100 && value < 100_000_000) {
        return match[1].trim();
      }
    }
  }
  return null;
}

/**
 * Extract description text from a line (everything except the amount part).
 */
function extractDescription(line: string, amount: string): string {
  const idx = line.indexOf(amount);
  let desc = idx >= 0
    ? (line.substring(0, idx) + line.substring(idx + amount.length)).trim()
    : line.replace(amount, '').trim();

  desc = desc.replace(/^[\s\-:.,]+|[\s\-:.,]+$/g, '').trim();
  return desc;
}

/**
 * Check if a line is likely a total line (not an individual item).
 */
function isTotalLine(line: string): boolean {
  const lower = line.toLowerCase();
  return TOTAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Parse raw OCR text from a receipt image and extract all line items.
 * Handles OCR blocks where description and amount may be on separate lines.
 */
export function parseReceiptText(text: string): ReceiptData {
  if (!text || text.trim().length === 0) {
    return { items: [], rawText: '' };
  }

  const cleanedText = text.replace(/\r/g, '');
  const lines = cleanedText.split('\n');
  const items: ReceiptLineItem[] = [];
  let total: string | undefined;
  let pendingDescription: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) continue;

    const amount = extractLineAmount(trimmed);

    if (amount) {
      if (isTotalLine(trimmed)) {
        total = amount;
        pendingDescription = null;
        continue;
      }

      // Try to get description from the same line
      let description = extractDescription(trimmed, amount);

      // If no description on this line, use the previous text-only line
      if (description.length < 2 && pendingDescription) {
        description = pendingDescription;
      }

      if (description.length >= 2) {
        items.push({ description, amount });
      }

      pendingDescription = null;
    } else {
      // Line has no amount - store as potential description for next line
      const cleanLine = trimmed.replace(/^[\s\-:.,]+|[\s\-:.,]+$/g, '').trim();
      if (cleanLine.length >= 2 && /[a-zA-ZÀ-ÿ]/.test(cleanLine)) {
        pendingDescription = cleanLine;
      }
    }
  }

  if (!total && items.length > 0) {
    const sum = items.reduce(
      (acc, item) => acc + parseFloat(normalizeAmount(item.amount)),
      0,
    );
    total = String(Math.round(sum));
  }

  return { items, total, rawText: cleanedText };
}
