/**
 * Capture d'écran d'une conversation d'opérateur (MVola, Orange Money,
 * Airtel Money) dans l'appli Messages : une bulle = un SMS = une opération
 * (plus ses frais). Les en-têtes de jour (« mardi 30 juin • 17:26 ») datent
 * les bulles qui suivent ; heures seules, nom du contact, barre d'état et
 * bandeaux de l'appli ne donnent rien (aucun montant d'opération).
 */
import type { OcrLine, OcrPage, ParsedOperation, ParseResult, SourceParser } from '../types';
import { normalizeText, toYmd } from '../text';
import { parseDayHeader } from '../generic/dates';
import { parseSms } from './index';
import { operatorOf, referenceOf } from './fields';

export const SMS_SCREENSHOT_SOURCE = 'sms-screenshot';

// Marques d'un SMS d'opérateur (en plus d'un montant et d'un sens).
const SMS_MARKS = /\b(trans\.?\s*id|tid|nouveau solde|votre solde|orange money|m\s?vola|airtel money|ny volanao)\b/;
// « mardi 30 juin • 17:26 », « Aujourd'hui · 09:38 » : l'heure de l'en-tête est retirée.
const HEADER_TIME = /\s*[•·∙.,-]?\s*\d{1,2}[:h.]\d{2}\s*$/;
// Heure seule (barre d'état, sous une bulle) : coupe une bulle, ne date rien.
const TIME_ONLY = /^\d{1,2}[:h.]\d{2}(\s*(am|pm))?$/i;

// Début habituel d'un SMS d'opérateur (fr, mg).
const SMS_OPENER = /^(<#>|votre |vous |paiement |cher client|connexion |nandefa|nahazo|nividy|nisintona|mvola|airtel|orange money)/i;

interface Bubble {
  text: string;
  date: string | null;
  /** Heure seule juste sous la bulle (Messagerie Huawei) : bulle entière à l'écran. */
  timed: boolean;
}

// Messagerie Huawei : « mardi Aujourd'hui », « jeudi Hier » (jour de semaine devant).
const WEEKDAY_RELATIVE = /^[A-Za-zÀ-ÿ]+\s+(aujourd.?hui|hier)$/i;

function byTop(lines: OcrLine[]): OcrLine[] {
  return [...lines].sort((a, b) => a.top - b.top || a.left - b.left);
}

function dayHeader(text: string, today: string): string | null {
  const t = text.trim();
  if (!HEADER_TIME.test(t) && !/^[A-Za-zÀ-ÿ]/.test(t)) return null;
  const day = t.replace(HEADER_TIME, '');
  return parseDayHeader(WEEKDAY_RELATIVE.test(day) ? day.replace(/^\S+\s+/, '') : day, today);
}

/** Bulles de la capture, dans l'ordre, avec la date de l'en-tête de jour au-dessus. */
export function bubblesOf(page: OcrPage, today: string): Bubble[] {
  const out: Bubble[] = [];
  let date: string | null = null;
  let current: OcrLine[] = [];
  const close = (timed = false) => {
    if (current.length) out.push({ text: current.map((l) => l.text.trim()).join(' '), date, timed });
    current = [];
  };
  for (const line of byTop(page.lines)) {
    const text = line.text.trim();
    if (!text) continue;
    const header = dayHeader(text, today);
    if (header) {
      close();
      date = header;
      continue;
    }
    if (TIME_ONLY.test(text)) {
      close(true);
      continue;
    }
    const prev = current[current.length - 1];
    if (prev) {
      const height = Math.max(prev.bottom - prev.top, 1);
      const sameBlock = prev.block !== undefined && prev.block === line.block;
      // Écart vertical supérieur à ~0,9 ligne : nouvelle bulle (sauf même bloc OCR).
      if (!sameBlock && line.top - prev.bottom > height * 0.9) close();
      // Bulles collées (même minute) : une phrase finie suivie d'un début de SMS.
      // Seulement si la bulle en cours est déjà complète (sa référence est lue) : un retour
      // à la ligne avant « Votre solde… » dans une même bulle ne coupe rien.
      else if (!sameBlock && /[.!]$/.test(prev.text.trim()) && SMS_OPENER.test(text) && !/^(votre|nouveau) solde/i.test(text)
        && referenceOf(current.map((l) => l.text).join(' '))) close();
    }
    current.push(line);
  }
  close();
  return out;
}

export function parseSmsScreenshot(page: OcrPage, today = toYmd(new Date())): ParseResult {
  const operations: ParsedOperation[] = [];
  const operator = operatorOf(page.lines.map((l) => l.text).join(' '));
  const bubbles = bubblesOf(page, today);
  // Heure sous chaque bulle (Huawei) : une bulle sans heure après la dernière heure est
  // coupée par le bas de l'écran (référence non lue) → lue sur la capture suivante.
  const lastTimed = bubbles.map((b) => b.timed).lastIndexOf(true);
  const timedLayout = bubbles.filter((b) => b.timed).length >= 2;
  bubbles.forEach((bubble, i) => {
    if (timedLayout && i > lastTimed) return;
    operations.push(...parseSms(bubble.text, today, bubble.date, operator));
  });
  return { operations, partial: 0 };
}

/** Confiance : au moins une bulle lue comme opération d'opérateur (montant, sens, marque de SMS). */
function detect(page: OcrPage): number {
  const today = toYmd(new Date());
  const read = bubblesOf(page, today).filter(
    (b) => SMS_MARKS.test(normalizeText(b.text)) && parseSms(b.text, today, b.date).length > 0
  );
  return read.length > 0 ? Math.min(0.95, 0.8 + read.length * 0.05) : 0;
}

export const smsScreenshotParser: SourceParser = {
  id: SMS_SCREENSHOT_SOURCE, label: 'SMS', detect, parse: (page) => parseSmsScreenshot(page),
};
