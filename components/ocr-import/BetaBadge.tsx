import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

/** Petit badge « Bêta » : l'import par capture est utilisable mais pas encore stable. */
export function BetaBadge() {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('ocrImport.beta')}
      style={{
        alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, borderColor: v2.brand,
        backgroundColor: v2.brandTint, paddingHorizontal: 6, paddingVertical: 1,
      }}
    >
      <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: v2.brand }}>
        {t('ocrImport.beta')}
      </Text>
    </View>
  );
}
