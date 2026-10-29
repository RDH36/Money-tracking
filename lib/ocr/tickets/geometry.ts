/**
 * Géométrie des photos de tickets : redressement des photos pivotées de 90°,
 * zone d'un ticket, appariement libellé ↔ valeur sur des tickets inclinés.
 */
import type { OcrLine, OcrPage } from '../types';

export const lineHeight = (l: OcrLine) => Math.max(1, l.bottom - l.top);
export const centerY = (l: OcrLine) => (l.top + l.bottom) / 2;
export const centerX = (l: OcrLine) => (l.left + l.right) / 2;

export function byTop(lines: OcrLine[]): OcrLine[] {
  return [...lines].sort((a, b) => centerY(a) - centerY(b) || a.left - b.left);
}

function rotate(page: OcrPage, clockwise: boolean): OcrPage {
  const { width: w, height: h } = page;
  const lines = page.lines.map((l) =>
    clockwise
      ? { ...l, left: l.top, right: l.bottom, top: w - l.right, bottom: w - l.left }
      : { ...l, left: h - l.bottom, right: h - l.top, top: l.left, bottom: l.right }
  );
  return { width: h, height: w, lines };
}

/**
 * Sens de lecture possibles de la page. Une photo de ticket pivotée de 90°
 * donne des boîtes de texte plus hautes que larges : on essaie alors les deux
 * rotations. Sinon la page telle quelle (captures d'écran, tickets droits).
 */
export function orientations(page: OcrPage): OcrPage[] {
  const words = page.lines.filter((l) => l.text.trim().length >= 6);
  const tall = words.filter((l) => l.bottom - l.top > (l.right - l.left) * 1.5).length;
  if (words.length < 4 || tall * 2 <= words.length) return [page];
  return [rotate(page, true), rotate(page, false)];
}

/**
 * Lignes d'un seul ticket : celles dont le centre tombe dans la bande
 * horizontale autour de l'ancre (en-tête du ticket). Écarte un second ticket
 * posé à côté, coupé au bord de la photo.
 */
export function ticketColumn(lines: OcrLine[], anchor: OcrLine): OcrLine[] {
  const w = anchor.right - anchor.left;
  const min = anchor.left - w * 1.0;
  const max = anchor.right + w * 1.5;
  return lines.filter((l) => centerX(l) >= min && centerX(l) <= max);
}

/**
 * Valeur de chaque libellé quand l'OCR les lit sur deux lignes séparées
 * (libellé à gauche, valeur à droite). Ticket incliné : la valeur glisse
 * d'une demi-ligne, donc on apparie par rang (1er libellé ↔ 1re valeur) quand
 * les nombres concordent, sinon par centre le plus proche (≤ 0.6 ligne).
 * Retourne null pour un libellé sans valeur sûre.
 */
export function pairByRow(labels: OcrLine[], values: OcrLine[]): (OcrLine | null)[] {
  const ls = byTop(labels);
  const vs = byTop(values);
  const order = labels.map((l) => ls.indexOf(l));
  if (ls.length === vs.length) return order.map((i) => vs[i]);
  return labels.map((l) => {
    let best: OcrLine | null = null;
    let bestGap = lineHeight(l) * 0.6;
    for (const v of values) {
      const gap = Math.abs(centerY(v) - centerY(l));
      if (gap <= bestGap) {
        best = v;
        bestGap = gap;
      }
    }
    return best;
  });
}

/** Lignes situées à droite de la ligne de libellé (même ticket). */
export function rightOf(label: OcrLine, lines: OcrLine[]): OcrLine[] {
  return lines.filter((l) => l !== label && l.left >= label.right - lineHeight(label) * 0.5);
}
