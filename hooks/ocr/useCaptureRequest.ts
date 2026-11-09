import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { pickCaptures } from '@/components/ocr-import/ImportCaptureEntry';
import { takeTicketPhoto } from '@/components/ocr-import/entry/takePhoto';
import {
  afterPick, initialCaptureState, type CaptureParams, type CaptureState, type PickAction, type PickResult,
} from '@/lib/ocr/import/pickFlow';

async function runPicker(action: PickAction): Promise<PickResult> {
  try {
    return action === 'gallery' ? { uris: await pickCaptures() } : await takeTicketPhoto();
  } catch (err) {
    console.warn('Image picker failed:', err);
    return { failed: true };
  }
}

/**
 * Captures à lire par l'écran d'import : reçues en paramètre (partage), ou
 * choisies depuis l'écran lui-même (sélecteur ouvert au montage, puis
 * « Importer d'autres captures ») sans nouvelle navigation.
 */
export function useCaptureRequest(params: CaptureParams) {
  const [state, setState] = useState<CaptureState>(() => initialCaptureState(params));
  const seq = useRef(0);
  const busy = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pick = useCallback(async (action: PickAction, first: boolean) => {
    if (busy.current) return;
    busy.current = true;
    const result = await runPicker(action);
    busy.current = false;
    seq.current += 1;
    const step = afterPick(first ? null : stateRef.current, action, result, seq.current);
    if ('back' in step) router.back();
    else setState(step.state);
  }, []);

  // 1er choix, une seule fois au montage.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || state.status !== 'picking') return;
    started.current = true;
    // Laisse l'écran d'import se peindre avant que le sélecteur ne le recouvre.
    requestAnimationFrame(() => requestAnimationFrame(() => pick(state.action, true)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nouveau partage reçu alors que l'écran est affiché (router.replace, mêmes paramètres de route).
  const lastUris = useRef(params.uris);
  useEffect(() => {
    if (!params.uris || params.uris === lastUris.current) return;
    lastUris.current = params.uris;
    setState(initialCaptureState(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.uris]);

  const importMore = useCallback(() => pick('gallery', false), [pick]);
  return { state, importMore };
}
