import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonStack, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { formatDay } from '@/components/plus/format';

interface QuotaReachedSheetProps {
  isOpen: boolean;
  limit: number;
  resetsOn: Date;
  /** « Saisir à la main » : bouton principal. */
  onManual: () => void;
  onEnterCode: () => void;
  onClose: () => void;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Texte E4 (lot 0 : sans phrase Plus), partagé avec l'écran d'import. */
export function useQuotaReachedText(limit: number, resetsOn: Date): string {
  const { t, i18n } = useTranslation();
  return t('ocrImport.quota.reachedBody', { count: limit, date: formatDay(ymd(resetsOn), i18n.language) });
}

/** E4 : lectures du cycle épuisées, à la tentative d'import depuis la carte. */
export function QuotaReachedSheet({ isOpen, limit, resetsOn, onManual, onEnterCode, onClose }: QuotaReachedSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const body = useQuotaReachedText(limit, resetsOn);
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('ocrImport.entryTitle')}
      title={t('ocrImport.quota.reachedTitle')}
      footer={
        <DialogButtonStack>
          <DialogPrimaryBtn label={t('ocrImport.quota.manual')} onPress={onManual} />
          <DialogGhostBtn label={t('plus.enterCode')} onPress={onEnterCode} />
        </DialogButtonStack>
      }
    >
      <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20, color: v2.inkMuted }}>{body}</Text>
    </BottomSheet>
  );
}
