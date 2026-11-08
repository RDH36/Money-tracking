/**
 * « Rappelle-moi ce soir » (1re dépense de l'onboarding) : quel rappel
 * l'utilisateur recevra. Le rappel du soir quotidien tombe à 19 h ;
 * entre 19 h et 21 h on ajoute un rappel unique à 21 h ; après 21 h, le
 * prochain est celui de demain 19 h. Fonction pure, testable.
 */
export type DeferSlot = 'tonight_19' | 'tonight_21' | 'tomorrow_19';

export const EVENING_HOUR = 19;
export const LATE_EVENING_HOUR = 21;

export function deferSlot(now: Date): DeferSlot {
  const h = now.getHours();
  if (h < EVENING_HOUR) return 'tonight_19';
  if (h < LATE_EVENING_HOUR) return 'tonight_21';
  return 'tomorrow_19';
}

/** Date du rappel unique à 21 h (créneau `tonight_21`), le jour de `now`. */
export function lateEveningDate(now: Date): Date {
  const d = new Date(now);
  d.setHours(LATE_EVENING_HOUR, 0, 0, 0);
  return d;
}
