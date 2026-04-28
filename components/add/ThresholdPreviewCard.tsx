import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface ThresholdPreviewCardProps {
  spent: string;
  limit: string;
  percentage: number;
}

export function ThresholdPreviewCard({
  spent,
  limit,
  percentage,
}: ThresholdPreviewCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const over = percentage >= 100;
  const accent = over ? v2.bad : v2.warn;
  const accentSoft = over ? v2.badSoft : v2.warnSoft;
  const title = over ? t('add.budgetExceeded') : t('add.thresholdPass80');

  return (
    <View
      style={{
        marginTop: 14,
        backgroundColor: accentSoft,
        borderWidth: 1,
        borderColor: accent + '4D',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="warning" size={14} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 12,
            fontWeight: '700',
            color: v2.ink,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 11,
            color: v2.inkMuted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {spent} / {limit} ({percentage}%)
        </Text>
      </View>
    </View>
  );
}
