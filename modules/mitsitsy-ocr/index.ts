import { requireOptionalNativeModule, type NativeModule } from 'expo';

/** One recognised text line, box in image pixels, glyph colour as #rrggbb. */
export interface NativeOcrLine {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  block: number;
  color: string | null;
}

export interface NativeOcrResult {
  width: number;
  height: number;
  lines: NativeOcrLine[];
}

type MitsitsyOcrEvents = { onShare: () => void };

declare class MitsitsyOcrModule extends NativeModule<MitsitsyOcrEvents> {
  recognize(uri: string): Promise<NativeOcrResult>;
  getSharedImages(): Promise<string[]>;
}

// Android only (ML Kit). Null on iOS / web / Expo Go: callers hide the feature.
const native = requireOptionalNativeModule<MitsitsyOcrModule>('MitsitsyOcr');

export const isOcrAvailable = native != null;

export function recognizeImage(uri: string): Promise<NativeOcrResult> {
  if (!native) return Promise.reject(new Error('OCR_UNAVAILABLE'));
  return native.recognize(uri);
}

/** file:// URIs of images shared to the app since the last call. */
export async function getSharedImages(): Promise<string[]> {
  return native ? native.getSharedImages() : [];
}

export function addShareListener(listener: () => void): { remove: () => void } {
  if (!native) return { remove: () => {} };
  return native.addListener('onShare', listener);
}
