/**
 * Proposition unique « 3 jours de saisie » sur l'accueil : réservée aux
 * nouvelles installations restées en mode « soir ». Fonction pure.
 */
export const HABIT_PROMPT_MIN_DAYS = 3;
export const HABIT_PROMPT_SHOWN_KEY = 'habit_prompt_shown';
export const REMINDER_ORIGIN_KEY = 'reminder_origin';
export const REMINDER_ORIGIN_NEW_INSTALL = 'new_install';

export interface HabitPromptInput {
  reminderFrequency: string | null | undefined;
  reminderOrigin: string | null | undefined;
  alreadyShown: boolean;
  /** Jours distincts (par created_at, transactions non supprimées) avec une saisie. */
  distinctDays: number;
}

export function isHabitPromptEligible(i: HabitPromptInput): boolean {
  return i.reminderFrequency === 'evening'
    && i.reminderOrigin === REMINDER_ORIGIN_NEW_INSTALL
    && !i.alreadyShown
    && i.distinctDays >= HABIT_PROMPT_MIN_DAYS;
}

/** Requête SQL des jours distincts (heure locale) avec au moins une saisie. */
export const DISTINCT_ENTRY_DAYS_SQL =
  "SELECT COUNT(DISTINCT date(created_at, 'localtime')) AS n FROM transactions WHERE deleted_at IS NULL";
