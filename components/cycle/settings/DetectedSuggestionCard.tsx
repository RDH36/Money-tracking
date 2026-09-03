import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';

interface DetectedSuggestionCardProps {
  day: number;
  /** Revenu détecté en centimes, ou `null` si inconnu. */
  amount: number | null;
  currency: string;
  onUse: () => void;
}

/**
 * Carte douce « D'après tes saisies » dans Mon cycle : ce que l'historique
 * suggère quand il diffère du réglage courant, avec un bouton « Utiliser ».
 */
export function DetectedSuggestionCard({ day, amount, currency, onUse }: DetectedSuggestionCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const line = amount
    ? t('settings.cycle.detectedLine', { day, amount: formatMoneyFr(amount), currency })
    : t('settings.cycle.detectedLineNoAmount', { day });

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: v2.brandTint, borderRadius: 16, padding: 14,
      }}
    >
      <Ionicons name="sparkles-outline" size={18} color={v2.brand} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', color: v2.brandDeep, letterSpacing: 0.3 }}>
          {t('settings.cycle.detectedTitle')}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink,
            marginTop: 2, fontVariant: ['tabular-nums'],
          }}
        >
          {line}
        </Text>
      </View>
      <Pressable
        onPress={onUse}
        hitSlop={6}
        style={{
          minHeight: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center',
          backgroundColor: v2.brand,
        }}
      >
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.inkOnDark }}>
          {t('settings.cycle.use')}
        </Text>
      </Pressable>
    </View>
  );
}
