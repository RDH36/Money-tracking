/**
 * Chiffre du jour (carte « Aujourd'hui » de l'onglet Activité, bandeau du
 * rappel du soir sur l'écran d'ajout) : un seul calcul pour les deux.
 * Fonction pure, `now` injectable pour les tests.
 */

export interface TodayTx {
  created_at: string;
  type: string;
  amount: number;
  transfer_id?: string | null;
}

export interface TodayStats {
  income: number;
  expense: number;
  /** Opérations du jour (hors transferts), revenus compris. */
  count: number;
  /** Dépenses du jour seulement. */
  expenseCount: number;
  net: number;
}

export function isSameDay(iso: string, ref: Date): boolean {
  try {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear()
      && d.getMonth() === ref.getMonth()
      && d.getDate() === ref.getDate();
  } catch {
    return false;
  }
}

export function computeTodayStats(transactions: TodayTx[], now: Date): TodayStats {
  let income = 0, expense = 0, count = 0, expenseCount = 0;
  for (const tx of transactions) {
    if (tx.transfer_id) continue;
    if (!isSameDay(tx.created_at, now)) continue;
    count++;
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') { expense += tx.amount; expenseCount++; }
  }
  return { income, expense, count, expenseCount, net: income - expense };
}
