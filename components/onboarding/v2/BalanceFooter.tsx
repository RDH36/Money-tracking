import { View, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { PrimaryBtn } from './Primitives';

const TERMS_URL = 'https://www.mitsitsy.app/terms';
const PRIVACY_URL = 'https://www.mitsitsy.app/privacy';

interface BalanceFooterProps {
  loading: boolean;
  onFinish: () => void;
  onLater: () => void;
}

/** Bas de l'écran des soldes (dernière étape) : Terminer, plus tard, CGU. */
export function BalanceFooter({ loading, onFinish, onLater }: BalanceFooterProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const link = { color: v2.brand, fontWeight: '700' as const, textDecorationLine: 'underline' as const };
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <PrimaryBtn
        label={loading ? t('common.loading') : t('onboarding.finish')}
        onPress={onFinish}
        disabled={loading}
      />
      <Pressable
        onPress={onLater}
        disabled={loading}
        accessibilityRole="button"
        hitSlop={8}
        style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 12 }}
      >
        <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.inkMuted }}>
          {t('onboarding.balanceLater')}
        </Text>
      </Pressable>
      <Text
        style={{
          textAlign: 'center', marginTop: 12, paddingHorizontal: 8,
          fontFamily: v2.fontUI, fontSize: 11, lineHeight: 16,
          color: v2.inkSubtle,
        }}
      >
        {t('onboarding.termsAcceptOnFinish')}{' '}
        <Text onPress={() => Linking.openURL(TERMS_URL)} style={link}>
          {t('onboarding.termsLink')}
        </Text>
        {' '}{t('onboarding.and')}{' '}
        <Text onPress={() => Linking.openURL(PRIVACY_URL)} style={link}>
          {t('onboarding.privacyLink')}
        </Text>
        .
      </Text>
    </View>
  );
}
