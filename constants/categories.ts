export interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'food', name: 'Nourriture', icon: 'fast-food', color: '#FF6B6B' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#9B59B6' },
  { id: 'bills', name: 'Factures', icon: 'document-text', color: '#3498DB' },
  { id: 'health', name: 'Santé', icon: 'medical', color: '#2ECC71' },
  { id: 'entertainment', name: 'Loisirs', icon: 'game-controller', color: '#F39C12' },
  { id: 'education', name: 'Éducation', icon: 'school', color: '#1ABC9C' },
  { id: 'other', name: 'Autre', icon: 'cube', color: '#95A5A6' },
];

/** Lookup of the seeded default name for each base category id. */
export const DEFAULT_CATEGORY_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.id, c.name])
);

/**
 * Returns the user-facing display name for a category.
 *
 * Base categories are translated via `t('categories.<id>')` ONLY while their
 * stored name still matches the seeded default. Once the user has renamed a
 * base category, the stored name is returned as-is so the rename is honored
 * everywhere (dashboard, activity, reports, budgets). Custom categories always
 * return their stored name.
 */
export function getCategoryDisplayName(
  categoryId: string | null | undefined,
  storedName: string | null | undefined,
  t: (key: string) => string
): string {
  if (!categoryId) return storedName ?? '';
  const defaultName = DEFAULT_CATEGORY_NAME_BY_ID[categoryId];
  if (defaultName !== undefined && storedName === defaultName) {
    return t(`categories.${categoryId}`);
  }
  return storedName ?? '';
}
