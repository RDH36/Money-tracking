import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { formatDay } from '@/components/plus/format';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Corps de la limite d'import (feuille ET écran plein) : jauge pleine et
 * texte bienveillant. Aucune mention d'achat (règles Play, Madagascar).
 */
export function QuotaReachedContent({ limit, resetsOn }: { limit: number; resetsOn: Date }) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const date = formatDay(ymd(resetsOn), i18n.language);
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: Math.max(1, limit) }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: v2.brand }} />
        ))}
      </View>
      <Text style={{ marginTop: 14, fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20, color: v2.inkMuted }}>
        {t('ocrImport.limit.body', { date })}
      </Text>
    </View>
  );
}
