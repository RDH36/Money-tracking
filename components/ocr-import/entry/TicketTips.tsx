import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TIPS: { icon: IoniconName; key: string }[] = [
  { icon: 'receipt-outline', key: 'one' },
  { icon: 'scan-outline', key: 'flat' },
  { icon: 'sunny-outline', key: 'light' },
];

/** Tickets papier : les trois gestes pour une photo lisible. */
export function TicketTips() {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginTop: 16, borderRadius: 14, borderWidth: 1, borderColor: v2.hairline,
        backgroundColor: v2.bgSurface, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
      }}
    >
      <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.ink }}>
        {t('ocrImport.tips.title')}
      </Text>
      {TIPS.map((tip) => (
        <View key={tip.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={tip.icon} size={14} color={v2.brand} />
          <Text style={{ flex: 1, fontFamily: v2.fontUIRegular, fontSize: 12, color: v2.inkMuted }}>
            {t(`ocrImport.tips.${tip.key}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}
