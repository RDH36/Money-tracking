import { View, Text, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonStack, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import type { DeferResult } from '@/hooks/habit/useDeferReminder';

interface DeferConfirmSheetProps {
  result: DeferResult | null;
  /** Fermeture (« D'accord », « Plus tard », glisser) : retour à l'accueil. */
  onDone: () => void;
}

const WHEN_KEY = {
  tonight_19: 'habit.confirm.at19',
  tonight_21: 'habit.confirm.at21',
  tomorrow_19: 'habit.confirm.tomorrow19',
} as const;

/** Confirmation de « Rappelle-moi ce soir » (ou notifications bloquées). */
export function DeferConfirmSheet({ result, onDone }: DeferConfirmSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const granted = result?.granted ?? true;
  const text = { fontFamily: v2.fontUI, fontSize: 14, lineHeight: 20, color: v2.inkMuted, textAlign: 'center' as const };
  return (
    <BottomSheet
      isOpen={!!result}
      onClose={onDone}
      title={granted ? t('habit.confirm.title') : t('habit.confirm.blockedTitle')}
      footer={
        granted ? (
          <DialogButtonStack>
            <DialogPrimaryBtn label={t('habit.confirm.ok')} onPress={onDone} />
          </DialogButtonStack>
        ) : (
          <DialogButtonStack>
            <DialogPrimaryBtn
              label={t('habit.confirm.openSettings')}
              onPress={() => { Linking.openSettings().catch(() => {}); onDone(); }}
            />
            <DialogGhostBtn label={t('habit.confirm.later')} onPress={onDone} />
          </DialogButtonStack>
        )
      }
    >
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Image
          source={require('@/assets/images/bubule-enjoy.png')}
          style={{ width: 110, height: 110 }}
          contentFit="contain"
        />
        {granted && result ? (
          <>
            <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 18, color: v2.ink, textAlign: 'center' }}>
              {t(WHEN_KEY[result.slot])}
            </Text>
            <Text style={text}>{t('habit.confirm.body')}</Text>
          </>
        ) : (
          <Text style={text}>{t('habit.confirm.blockedBody')}</Text>
        )}
      </View>
    </BottomSheet>
  );
}
