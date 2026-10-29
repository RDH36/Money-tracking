import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { CaptureExample } from './CaptureExample';
import { TicketTips } from './TicketTips';

interface CaptureIntroSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  /** Libellé du bouton principal (galerie ou appareil photo). */
  continueLabel?: string;
}

/** Première utilisation : quelle capture ou quelle photo de ticket faire, avec un exemple. */
export function CaptureIntroSheet({ isOpen, onClose, onContinue, continueLabel }: CaptureIntroSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('ocrImport.intro.overline')}
      title={t('ocrImport.intro.title')}
      maxHeightPct={90}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('ocrImport.intro.later')} onPress={onClose} />
          <DialogPrimaryBtn label={continueLabel ?? t('ocrImport.intro.pick')} onPress={onContinue} />
        </DialogButtonRow>
      }
    >
      <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20, color: v2.inkMuted }}>
        {t('ocrImport.intro.body')}
      </Text>
      <View style={{ marginTop: 16 }}>
        <CaptureExample />
      </View>
      <TicketTips />
    </BottomSheet>
  );
}
