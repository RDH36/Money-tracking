import { reminderPlan, type ReminderPlanInput } from './rules';

/** Rappel unique du programme « Testeur bêta » (J+2, 12 h 30). */
export const IMPORT_BETA_REMINDER_ID = 'import-beta-reminder';
export const IMPORT_BETA_REMINDER_TYPE = 'import_beta';

/** Sous-ensemble d'expo-notifications utilisé ici, injectable dans les tests. */
export interface ReminderApi {
  /** Permission déjà accordée ? Ne la demande jamais. */
  isGranted(): Promise<boolean>;
  listScheduledIds(): Promise<string[]>;
  cancel(id: string): Promise<void>;
  scheduleAt(id: string, date: Date, type: string): Promise<void>;
}

export type ReminderSync = 'scheduled' | 'kept' | 'cancelled' | 'none';

let queue: Promise<unknown> = Promise.resolve();

async function syncOnce(api: ReminderApi, input: Omit<ReminderPlanInput, 'granted'>): Promise<ReminderSync> {
  const granted = input.answered ? false : await api.isGranted();
  const date = reminderPlan({ ...input, granted });
  const exists = (await api.listScheduledIds()).includes(IMPORT_BETA_REMINDER_ID);
  if (!date) {
    if (!exists) return 'none';
    await api.cancel(IMPORT_BETA_REMINDER_ID);
    return 'cancelled';
  }
  // Déjà programmé : on n'y touche pas (jamais deux fois, jamais décalé).
  if (exists) return 'kept';
  await api.scheduleAt(IMPORT_BETA_REMINDER_ID, date, IMPORT_BETA_REMINDER_TYPE);
  return 'scheduled';
}

/**
 * Aligne la notification sur l'état courant : programmée une seule fois si une
 * première lecture existe, que l'avis n'est pas envoyé, que les rappels de
 * l'app ne sont pas coupés et que la permission est accordée ; annulée sinon.
 * Les appels sont mis en file (lancement, lecture et envoi peuvent se croiser).
 */
export function syncImportBetaReminder(
  api: ReminderApi, input: Omit<ReminderPlanInput, 'granted'>,
): Promise<ReminderSync> {
  const run = queue.then(() => syncOnce(api, input)).catch((): ReminderSync => 'none');
  queue = run;
  return run;
}
