/**
 * Programme « Testeur bêta » de l'import : règles pures (aucune dépendance
 * React Native), testées par node:test. La date et les réglages sont injectés.
 */

/** Clé du sondage dans la table distante `feature_surveys`. */
export const IMPORT_SURVEY_KEY = 'import_g1';

/** Clés de la table locale `settings`. */
export const FEEDBACK_KEYS = {
  /** Horodatage ISO de l'envoi de l'avis (« Testeur bêta ✓ »). */
  rewardedAt: 'import_feedback_rewarded_at',
  /** Horodatage ISO du dernier « Plus tard ». */
  laterAt: 'import_g1_survey_later_at',
  /** Horodatage ISO de la première lecture d'import. */
  firstReadAt: 'import_beta_first_read_at',
  /** Avis en attente d'envoi (JSON), supprimé une fois reçu par le serveur. */
  pending: 'import_g1_survey_pending',
  /** Nombre de refus définitifs (4xx) de l'avis en attente. */
  rejects: 'import_g1_survey_rejects',
} as const;

/** Refus définitifs du serveur avant d'abandonner l'envoi de l'avis en attente. */
export const MAX_SURVEY_REJECTS = 3;

export const FEELINGS = ['great', 'ok', 'bad'] as const;
export type Feeling = (typeof FEELINGS)[number];

/** Après « Plus tard », pas de nouvelle proposition automatique avant ce délai. */
export const LATER_COOLDOWN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export interface AutoPromptInput {
  /** Lectures du cycle avant et après l'enregistrement. */
  prevUsed: number;
  used: number;
  limit: number;
  unlimited: boolean;
  answered: boolean;
  laterAt: string | null;
  now: Date;
}

/**
 * Proposer le sondage tout seul : uniquement au moment où le quota du cycle
 * vient d'être atteint, jamais après un avis envoyé, et pas dans les
 * 7 jours qui suivent un « Plus tard ».
 */
export function shouldAutoPrompt(i: AutoPromptInput): boolean {
  if (i.unlimited || i.answered) return false;
  if (!(i.prevUsed < i.limit && i.used >= i.limit)) return false;
  const later = toTime(i.laterAt);
  return later === null || i.now.getTime() - later >= LATER_COOLDOWN_DAYS * DAY_MS;
}

export interface BetaCardInput {
  loaded: boolean;
  unlimited: boolean;
  answered: boolean;
  used: number;
  limit: number;
}

export interface BetaCardState {
  /** Lectures affichées (bornées à la limite). */
  progress: number;
  limit: number;
  /** Quota atteint : la carte mène au sondage. */
  ready: boolean;
}

/** État de la carte de l'onglet Ajouter ; `null` = carte masquée. */
export function betaCardState(i: BetaCardInput): BetaCardState | null {
  if (!i.loaded || i.unlimited || i.answered || i.limit <= 0) return null;
  const progress = Math.max(0, Math.min(i.used, i.limit));
  return { progress, limit: i.limit, ready: progress >= i.limit };
}

export type SurveyError = 'feelingMissing' | 'emailInvalid' | 'emailMissing' | 'consentMissing';

export interface SurveyForm {
  feeling: Feeling | null;
  comment: string;
  email: string;
  consent: boolean;
}

export type SurveyValidation =
  | { ok: true; email: string | null }
  | { ok: false; error: SurveyError };

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

/**
 * Sans e-mail : l'avis part, sans participation au tirage. Avec e-mail : format
 * valide ET consentement coché, sinon refus (jamais d'e-mail envoyé sans accord).
 */
export function validateSurvey(form: SurveyForm): SurveyValidation {
  if (!form.feeling) return { ok: false, error: 'feelingMissing' };
  const email = form.email.trim();
  if (!email) return form.consent ? { ok: false, error: 'emailMissing' } : { ok: true, email: null };
  if (!isValidEmail(email)) return { ok: false, error: 'emailInvalid' };
  if (!form.consent) return { ok: false, error: 'consentMissing' };
  return { ok: true, email };
}

/** Rappel unique : 2 jours après la première lecture, à 12 h 30 (heure locale). */
export function betaReminderDate(firstReadAt: Date): Date {
  return new Date(firstReadAt.getFullYear(), firstReadAt.getMonth(), firstReadAt.getDate() + 2, 12, 30, 0, 0);
}

export interface ReminderPlanInput {
  firstReadAt: string | null;
  answered: boolean;
  /** Réglage de rappels de l'app ('off' = aucune notification). */
  frequency: string | null | undefined;
  /** Permission de notifications déjà accordée (jamais demandée ici). */
  granted: boolean;
  now: Date;
}

/** Date du rappel à programmer, ou `null` s'il ne doit pas (ou plus) exister. */
export function reminderPlan(i: ReminderPlanInput): Date | null {
  const first = toTime(i.firstReadAt);
  if (first === null || i.answered || !i.granted || i.frequency === 'off') return null;
  const date = betaReminderDate(new Date(first));
  return date.getTime() > i.now.getTime() ? date : null;
}
