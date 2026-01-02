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
