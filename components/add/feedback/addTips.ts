import type { TxMode } from '../ModeToggle';
import type { TxType } from '../TypePills';

/** Ordre de rotation de useTips('add'). */
const ADD_TIPS = ['tips.add.transferMoney', 'tips.add.addNote', 'tips.add.quickCategory'];

/** Le conseil parle-t-il de ce qui est à l'écran ? */
function fits(tip: string, mode: TxMode, type: TxType): boolean {
  if (tip === 'tips.add.transferMoney') return mode === 'transfer';
  // Seule la grille des dépenses se touche (la catégorie Revenu est fixe).
  if (tip === 'tips.add.quickCategory') return mode === 'transaction' && type === 'expense';
  return true;
}

/**
 * Conseil à afficher pour l'onglet actif : celui de la rotation s'il convient,
 * sinon le suivant qui convient (même ordre), sinon aucun.
 */
export function addTipFor(tip: string | null, mode: TxMode, type: TxType): string | null {
  if (!tip) return null;
  if (fits(tip, mode, type)) return tip;
  const start = ADD_TIPS.indexOf(tip);
  if (start < 0) return null;
  for (let k = 1; k < ADD_TIPS.length; k++) {
    const next = ADD_TIPS[(start + k) % ADD_TIPS.length];
    if (fits(next, mode, type)) return next;
  }
  return null;
}
