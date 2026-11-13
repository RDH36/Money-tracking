import type { TFunction } from 'i18next';
import { accountsBelowZero, type ReviewItem } from '@/lib/ocr/import/review';
import type { AccountWithBalance } from '@/types';

export interface ImportNotice { text: string; tone: 'bad' | 'warn' }

/** Message sous la liste de vérification (priorité : espèces négatif, échec, invalide, doublons). */
export function buildImportNotice(
  t: TFunction,
  items: ReviewItem[],
  accounts: AccountWithBalance[],
  saveFailed: boolean,
  invalidSelected: number,
): { notice: ImportNotice | null; cashBlocked: boolean } {
  const dupSelected = items.filter((i) => i.selected && i.duplicate).length;
  const cashBlocked = accountsBelowZero(items, accounts).some((b) => b.blocked);
  const notice: ImportNotice | null = cashBlocked
    ? { text: t('ocrImport.cashBlockedSave'), tone: 'bad' }
    : saveFailed
      ? { text: t('ocrImport.saveFailed'), tone: 'bad' }
      : invalidSelected > 0
        ? { text: t('ocrImport.invalid', { count: invalidSelected }), tone: 'bad' }
        : dupSelected > 0
          ? { text: t('ocrImport.dupSelected', { count: dupSelected }), tone: 'warn' }
          : null;
  return { notice, cashBlocked };
}
