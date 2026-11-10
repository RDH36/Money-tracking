import { useEffect, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import { PLUS_ENABLED } from '@/constants/app';
import { SettingsHeader } from '@/components/settings/v2/SettingsHeader';
import { BetaBadge } from '../BetaBadge';
import { PlusActivatedDialog, RedeemCodeSheet } from '@/components/plus';
import { DialogButtonStack, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { EyebrowLabel } from '@/components/onboarding/v2';
import type { License } from '@/lib/premium';
import { QuotaReachedContent } from '../entry/QuotaReachedContent';

interface QuotaBlockedViewProps {
  limit: number;
  used: number;
  resetsOn: Date;
  /** Code valide saisi : l'import reprend avec les lectures illimitées. */
  onUnlocked: () => void;
}

/** E4 plein écran : partage reçu alors que les lectures du cycle sont épuisées. */
export function QuotaBlockedView({ limit, used, resetsOn, onUnlocked }: QuotaBlockedViewProps) {
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const [codeOpen, setCodeOpen] = useState(false);
  // Bubule « reviens au prochain cycle » : plus petit sur les écrans bas (grande police).
  const { height } = useWindowDimensions();
  const bubuleSize = height < 700 ? 140 : 180;
  const [activated, setActivated] = useState<License | null>(null);

  useEffect(() => {
    posthog.capture('ocr_quota_reached', { limit, reads_used: used, surface: 'share' });
    // Une fois par affichage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manual = () => {
    posthog.capture('ocr_manual_fallback');
    router.replace('/(tabs)/add');
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <SettingsHeader title={t('ocrImport.title')} subtitle={t('ocrImport.overline')} onBack={close} />
        <View style={{ position: 'absolute', top: 14, right: 20 }}>
          <BetaBadge />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 }}>
        <Image
          source={require('@/assets/images/bubule-time.png')}
          contentFit="contain"
          accessibilityIgnoresInvertColors
          style={{ width: bubuleSize, height: bubuleSize, alignSelf: 'center', marginBottom: 12 }}
        />
        <EyebrowLabel>{t('ocrImport.limit.eyebrow')}</EyebrowLabel>
        <Text
          style={{
            marginTop: 4, marginBottom: 16, fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 24, color: v2.ink, letterSpacing: -0.5, lineHeight: 28,
          }}
        >
          {t('ocrImport.limit.title', { count: limit })}
        </Text>
        <QuotaReachedContent limit={limit} resetsOn={resetsOn} />
        <View style={{ marginTop: 24 }}>
          <DialogButtonStack>
            <DialogPrimaryBtn label={t('ocrImport.quota.manual')} onPress={manual} />
            {PLUS_ENABLED ? <DialogGhostBtn label={t('plus.enterCode')} onPress={() => setCodeOpen(true)} /> : null}
            <DialogGhostBtn label={t('ocrImport.limit.close')} onPress={close} />
          </DialogButtonStack>
        </View>
      </ScrollView>
      {PLUS_ENABLED ? (
        <>
          <RedeemCodeSheet
            isOpen={codeOpen}
            onClose={() => setCodeOpen(false)}
            onActivated={(l) => {
              setCodeOpen(false);
              setActivated(l);
            }}
          />
          <PlusActivatedDialog
            license={activated}
            onClose={() => {
              setActivated(null);
              onUnlocked();
            }}
          />
        </>
      ) : null}
    </View>
  );
}
