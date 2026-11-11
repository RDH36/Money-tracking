import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonStack, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { PLUS_ENABLED } from '@/constants/app';
import { QuotaReachedContent } from './QuotaReachedContent';

interface QuotaReachedSheetProps {
  isOpen: boolean;
  limit: number;
  resetsOn: Date;
  /** « Saisir à la main » : bouton principal. */
  onManual: () => void;
  onEnterCode: () => void;
  onClose: () => void;
}

/** E4 : lectures du cycle épuisées, à la tentative d'import depuis la carte. */
export function QuotaReachedSheet({ isOpen, limit, resetsOn, onManual, onEnterCode, onClose }: QuotaReachedSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('ocrImport.limit.eyebrow')}
      title={t('ocrImport.limit.title', { count: limit })}
      titleLines={2}
      footer={
        <DialogButtonStack>
          <DialogPrimaryBtn label={t('ocrImport.quota.manual')} onPress={onManual} />
          {PLUS_ENABLED ? <DialogGhostBtn label={t('plus.enterCode')} onPress={onEnterCode} /> : null}
          <DialogGhostBtn label={t('ocrImport.limit.close')} onPress={onClose} />
        </DialogButtonStack>
      }
    >
      <QuotaReachedContent limit={limit} resetsOn={resetsOn} />
    </BottomSheet>
  );
}
