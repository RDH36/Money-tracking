import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsHeader } from '@/components/settings/v2/SettingsHeader';
import { PlusActivatedDialog, RedeemCodeSheet } from '@/components/plus';
import type { License } from '@/lib/premium';
import { useQuotaReachedText } from '../entry/QuotaReachedSheet';
import { ImportStateView } from './ImportStateView';

interface QuotaBlockedViewProps {
  limit: number;
  resetsOn: Date;
  /** Code valide saisi : l'import reprend avec les lectures illimitées. */
  onUnlocked: () => void;
}

/** E4 plein écran : partage reçu alors que les lectures du cycle sont épuisées. */
export function QuotaBlockedView({ limit, resetsOn, onUnlocked }: QuotaBlockedViewProps) {
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const body = useQuotaReachedText(limit, resetsOn);
  const [codeOpen, setCodeOpen] = useState(false);
  const [activated, setActivated] = useState<License | null>(null);

  useEffect(() => {
    posthog.capture('ocr_quota_reached', { plan: 'free' });
  }, [posthog]);

  const manual = () => {
    posthog.capture('ocr_manual_fallback');
    router.replace('/(tabs)/add');
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <SettingsHeader title={t('ocrImport.title')} subtitle={t('ocrImport.overline')} onBack={() => router.back()} />
      </View>
      <ImportStateView
        icon="time-outline"
        title={t('ocrImport.quota.reachedTitle')}
        body={body}
        primary={{ label: t('ocrImport.quota.manual'), onPress: manual }}
        secondary={{ label: t('plus.enterCode'), onPress: () => setCodeOpen(true) }}
      />
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
    </View>
  );
}
