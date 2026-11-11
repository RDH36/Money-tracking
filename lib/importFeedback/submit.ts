import { FEEDBACK_KEYS, IMPORT_SURVEY_KEY, type Feeling } from './rules';
import { clearFeedbackSetting, readFeedbackState, writeFeedbackSetting, type SettingsDb } from './storage';

/** Accès au serveur des sondages, injecté (constantes de l'app, réseau). */
export interface SurveyTransport {
  url: string;
  anonKey: string;
  isOnline: () => Promise<boolean>;
  fetchImpl?: typeof fetch;
}

export interface SurveyPayloadInput {
  feeling: Feeling;
  /** Question et réponse telles que lues par l'utilisateur (back-office). */
  question: string;
  answer: string;
  comment: string;
  /** E-mail validé et consenti, sinon `null` (pas de participation au tirage). */
  email: string | null;
  /** Texte exact de la case cochée (preuve du consentement). */
  consentText: string;
  currency: string;
  appVersion: string;
  platform: string;
  project: string;
  now: Date;
}

/** Ligne `feature_surveys` : même forme que le sondage « sauvegarde cloud ». */
export function buildSurveyPayload(i: SurveyPayloadInput): Record<string, unknown> {
  const comment = i.comment.trim();
  return {
    survey_key: IMPORT_SURVEY_KEY,
    response: {
      items: [{ key: 'feeling', question: i.question, value: i.feeling, answer: i.answer }],
      comment: comment || null,
      draw: i.email
        ? { participates: true, consent: true, consent_text: i.consentText, consent_at: i.now.toISOString() }
        : { participates: false },
      answered_at: i.now.toISOString(),
    },
    currency: i.currency,
    email: i.email,
    app_version: i.appVersion,
    device_platform: i.platform,
    project: i.project,
  };
}

export type SendResult = 'sent' | 'kept' | 'none';

let inFlight: Promise<SendResult> | null = null;

async function sendOnce(db: SettingsDb, transport: SurveyTransport): Promise<SendResult> {
  const { pending } = await readFeedbackState(db);
  if (!pending) return 'none';
  if (!transport.url || !(await transport.isOnline())) return 'kept';
  try {
    const res = await (transport.fetchImpl ?? fetch)(`${transport.url}/rest/v1/feature_surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: transport.anonKey,
        Authorization: `Bearer ${transport.anonKey}`,
      },
      body: pending,
    });
    if (!res.ok) return 'kept';
  } catch {
    return 'kept';
  }
  await clearFeedbackSetting(db, FEEDBACK_KEYS.pending);
  return 'sent';
}

/**
 * Envoie l'avis en attente s'il y en a un. Il n'est effacé qu'après un accusé
 * du serveur : hors ligne ou en erreur, il reste pour le prochain lancement.
 * Un seul envoi à la fois (lancement et validation peuvent se croiser).
 */
export function sendPendingSurvey(db: SettingsDb, transport: SurveyTransport): Promise<SendResult> {
  if (!inFlight) {
    inFlight = sendOnce(db, transport)
      .catch((): SendResult => 'kept')
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

/** Met l'avis en file locale (avant tout envoi : rien n'est perdu hors ligne). */
export async function queueSurvey(db: SettingsDb, payload: Record<string, unknown>): Promise<void> {
  await writeFeedbackSetting(db, FEEDBACK_KEYS.pending, JSON.stringify(payload));
}
