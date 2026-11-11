/** Tuto vidéo de l'import (pur) : drapeau « déjà vu », langue de la vidéo, déclenchement. */

/** Clé `settings` posée dès le premier affichage du tuto (automatique ou par le bouton). */
export const TUTORIAL_SEEN_KEY = 'ocr_import_tutorial_seen_at';

export type TutorialLang = 'fr' | 'en';
export type TutorialSource = 'auto' | 'manual';

/** Vidéo anglaise pour une app en anglais, française pour tout le reste (fr, mg). */
export function tutorialLang(language: string | null | undefined): TutorialLang {
  return (language ?? '').toLowerCase().startsWith('en') ? 'en' : 'fr';
}

/**
 * Lancement automatique à la première ouverture de l'import : seulement quand le
 * drapeau a été lu ET qu'il est absent (`null` = pas encore lu → jamais de tuto,
 * pour ne pas le rejouer à quelqu'un qui l'a déjà vu).
 */
export function shouldAutoPlayTutorial(seen: boolean | null): boolean {
  return seen === false;
}
