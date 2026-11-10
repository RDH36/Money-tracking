/** Lecture des captures sur l'appareil : OCR natif puis parseur de la source. */
import { recognizeImage } from '@/modules/mitsitsy-ocr';
import { parsePage } from '../registry';
import type { ParsedOperation } from '../types';

export interface CapturesReading {
  operations: ParsedOperation[];
  /** Sources reconnues (ids), dans l'ordre d'apparition. */
  sources: string[];
  /** Captures lues mais non reconnues (autre appli, écran sans opérations). */
  unrecognized: number;
  /** Captures illisibles (fichier invalide, erreur OCR). */
  failed: number;
  /** Opérations coupées par le bord d'une capture. */
  partial: number;
}

export async function readCaptures(
  uris: string[],
  onProgress?: (done: number, total: number) => void
): Promise<CapturesReading> {
  const result: CapturesReading = { operations: [], sources: [], unrecognized: 0, failed: 0, partial: 0 };
  for (let i = 0; i < uris.length; i++) {
    onProgress?.(i, uris.length);
    try {
      const page = await recognizeImage(uris[i]);
      const parsed = parsePage(page);
      if (!parsed.source || parsed.operations.length === 0) {
        result.unrecognized++;
        result.partial += parsed.partial;
        continue;
      }
      if (!result.sources.includes(parsed.source)) result.sources.push(parsed.source);
      result.operations.push(...parsed.operations.map((op) => ({ ...op, image: i })));
      result.partial += parsed.partial;
    } catch (err) {
      console.warn('OCR failed for capture', i, err);
      result.failed++;
    }
  }
  onProgress?.(uris.length, uris.length);
  return result;
}
