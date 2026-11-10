import { useTranslation } from 'react-i18next';
import { CenterDialog } from '@/components/ui/CenterDialog';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useAppUpdateStore } from '@/stores/appUpdateStore';
import { UpdateProgressPill } from './UpdateProgressPill';

/**
 * Fenêtres de la mise à jour flexible (montées dans les onglets) :
 * « Mise à jour disponible » puis « Prête : redémarrer pour installer ».
 */
export function AppUpdateHost() {
  const { t } = useTranslation();
  const promptOpen = useAppUpdateStore((s) => s.promptOpen);
  const ready = useAppUpdateStore((s) => s.phase === 'downloaded' && !s.readyDismissed);
  const { accept, dismiss, dismissReady, restart } = useAppUpdateStore.getState();

  return (
    <>
      <UpdateProgressPill />
      <CenterDialog
        isOpen={promptOpen}
        onClose={dismiss}
        title={t('appUpdate.availableTitle')}
        body={t('appUpdate.availableBody')}
        iconName="arrow-down-circle-outline"
        footer={
          <DialogButtonRow>
            <DialogGhostBtn label={t('appUpdate.later')} onPress={dismiss} />
            <DialogPrimaryBtn label={t('appUpdate.update')} onPress={accept} />
          </DialogButtonRow>
        }
      />
      <CenterDialog
        isOpen={ready && !promptOpen}
        onClose={dismissReady}
        title={t('appUpdate.readyTitle')}
        body={t('appUpdate.readyBody')}
        iconName="checkmark-circle-outline"
        variant="success"
        footer={
          <DialogButtonRow>
            <DialogGhostBtn label={t('appUpdate.later')} onPress={dismissReady} />
            <DialogPrimaryBtn label={t('appUpdate.restart')} onPress={restart} />
          </DialogButtonRow>
        }
      />
    </>
  );
}
