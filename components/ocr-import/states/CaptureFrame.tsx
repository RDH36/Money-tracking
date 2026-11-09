import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsHeader } from '@/components/settings/v2/SettingsHeader';

/**
 * Fond + en-tête de l'écran d'import, communs à tous ses états (chargement du
 * quota compris) : l'écran a la même apparence dès sa première image.
 */
export function CaptureFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <SettingsHeader title={t('ocrImport.title')} subtitle={t('ocrImport.overline')} onBack={() => router.back()} />
      </View>
      {children}
    </View>
  );
}
