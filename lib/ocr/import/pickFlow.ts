/**
 * Écran d'import ouvert AVANT le sélecteur (galerie ou photo) : l'écran affiche
 * son cadre, lance le sélecteur, puis lit le résultat sur place. Logique pure
 * (testée) : état initial selon les paramètres de route, et suite d'un choix.
 */
export type PickAction = 'gallery' | 'camera';
export type PickError = 'pick' | 'camera' | 'cameraDenied';

/** Résultat brut d'un sélecteur : captures (vide = annulé), caméra refusée, ou échec. */
export type PickResult = { uris: string[] } | { denied: true } | { failed: true };

export type CaptureState =
  | { status: 'picking'; action: PickAction }
  | { status: 'ready'; key: string; uris: string[]; source: string; text?: string }
  | { status: 'error'; error: PickError };

/** Suite d'un choix : nouvel état, ou retour à l'écran précédent. */
export type PickStep = { state: CaptureState } | { back: true };

export interface CaptureParams {
  uris?: string;
  source?: string;
  pick?: string;
  /** Clé d'un collage de SMS (« Coller un SMS ») : le texte reste en mémoire, jamais dans l'URL. */
  sms?: string;
}

// Le texte collé (noms, numéros, montants) ne passe pas par les params de route :
// ils sont envoyés à PostHog par le suivi d'écran. On ne transmet qu'une clé.
const pastedSms = new Map<string, string>();
let pasteSeq = 0;

/** Garde le texte collé en mémoire et rend la clé à passer en param `sms`. */
export function stashPastedSms(text: string): string {
  pastedSms.clear();
  const key = `p${++pasteSeq}`;
  pastedSms.set(key, text);
  return key;
}

export function parseUris(raw: string | undefined): string[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** `pick` sans `uris` : l'écran ouvre lui-même le sélecteur. Sinon (partage) : lecture directe. */
export function initialCaptureState(params: CaptureParams): CaptureState {
  const text = params.sms ? pastedSms.get(params.sms) : undefined;
  if (text) return { status: 'ready', key: `sms:${params.sms}`, uris: [], source: 'sms', text };
  if (!params.uris && (params.pick === 'gallery' || params.pick === 'camera')) {
    return { status: 'picking', action: params.pick };
  }
  return { status: 'ready', key: params.uris ?? '', uris: parseUris(params.uris), source: params.source ?? 'gallery' };
}

/**
 * `prev` : état affiché quand le sélecteur a été ouvert (« Importer d'autres
 * captures » depuis l'écran) ; null pour le 1er choix (écran encore vide).
 * `seq` rend chaque import unique, même avec les mêmes images.
 */
export function afterPick(prev: CaptureState | null, action: PickAction, result: PickResult, seq: number): PickStep {
  if ('uris' in result && result.uris.length > 0) {
    return { state: { status: 'ready', key: `${seq}:${JSON.stringify(result.uris)}`, uris: result.uris, source: action } };
  }
  // Annulation, refus ou échec pendant « Importer d'autres captures » : l'import affiché reste.
  if (prev) return { state: prev };
  if ('denied' in result) return { state: { status: 'error', error: 'cameraDenied' } };
  if ('failed' in result) return { state: { status: 'error', error: action === 'gallery' ? 'pick' : 'camera' } };
  return { back: true };
}
