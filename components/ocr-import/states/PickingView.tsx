import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PickError } from '@/lib/ocr/import/pickFlow';
import { CaptureFrame } from './CaptureFrame';
import { ImportStateView } from './ImportStateView';

const ERROR_KEYS: Record<PickError, string> = {
  pick: 'ocrImport.pickError',
  camera: 'ocrImport.cameraError',
  cameraDenied: 'ocrImport.cameraDenied',
};

/**
 * Écran d'import ouvert avant le sélecteur : cadre + « Choix de la capture… »
 * pendant que la galerie ou l'appareil photo est ouvert, ou l'erreur du sélecteur.
 */
export function PickingView({ error }: { error: PickError | null }) {
  const { t } = useTranslation();
  return (
    <CaptureFrame>
      {error ? (
        <ImportStateView
          icon="alert-circle-outline" tone="bad" title={t(ERROR_KEYS[error])}
          primary={{ label: t('ocrImport.finish'), onPress: () => router.back() }}
        />
      ) : (
        <ImportStateView title={t('ocrImport.picking')} />
      )}
    </CaptureFrame>
  );
}
