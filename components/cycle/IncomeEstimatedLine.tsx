import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';

/**
 * Ligne discrète du bilan quand le revenu du cycle est estimé (revenu attendu
 * injecté faute de revenu saisi). Lien « Modifier » vers Paramètres → Mon cycle.
 */
export function IncomeEstimatedLine({ amount, currency }: { amount: number; currency: string }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="information-circle-outline" size={13} color={v2.inkSubtle} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, lineHeight: 16 }}>
        {t('analysis.incomeEstimated', { amount: formatMoneyFr(amount), currency })}
      </Text>
      <Pressable onPress={() => router.push('/settings/cycle' as any)} hitSlop={6}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.brand, fontWeight: '600' }}>
          {t('analysis.incomeEstimatedEdit')}
        </Text>
      </Pressable>
    </View>
  );
}
