import { useEffect } from 'react';
import { AppState } from 'react-native';
import { OCR_IMPORT_ENABLED } from '@/constants/app';
import { addShareListener, getSharedImages } from '@/modules/mitsitsy-ocr';
import { openCaptureImport } from './ImportCaptureEntry';

/**
 * Captures partagées vers Mitsitsy depuis une autre appli (menu Partager).
 * Monté dans les onglets : l'utilisateur a donc fini l'onboarding et
 * déverrouillé l'appli avant d'arriver sur l'écran de vérification.
 */
export function CaptureShareListener() {
  useEffect(() => {
    if (!OCR_IMPORT_ENABLED) return;
    const check = () => {
      getSharedImages()
        .then(openCaptureImport)
        .catch((err) => console.warn('Reading shared images failed:', err));
    };
    check();
    const share = addShareListener(check);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      share.remove();
      appState.remove();
    };
  }, []);

  return null;
}
