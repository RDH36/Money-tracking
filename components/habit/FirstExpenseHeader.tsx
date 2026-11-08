import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { EyebrowLabel } from '@/components/onboarding/v2';
import { deferSlot } from '@/lib/habit/deferSlot';

interface FirstExpenseHeaderProps {
  busy: boolean;
  onDefer: () => void;
}

/** Haut de l'écran d'ajout pour la 1re dépense (arrivée depuis l'onboarding). */
export function FirstExpenseHeader({ busy, onDefer }: FirstExpenseHeaderProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const late = deferSlot(new Date()) === 'tomorrow_19';
  return (
    <View>
      <EyebrowLabel>{t('habit.first.eyebrow')}</EyebrowLabel>
      <Text
        style={{
          marginTop: 4, fontFamily: v2.fontDisplay, fontWeight: '700',
          fontSize: 28, color: v2.ink, letterSpacing: -0.6, lineHeight: 32,
        }}
      >
        {t('habit.first.titleStart')}{' '}
        <Text style={{ fontStyle: 'italic', color: v2.brand }}>{t('habit.first.titleAccent')}</Text>
      </Text>
      <Text style={{ marginTop: 8, fontFamily: v2.fontUI, fontSize: 14, color: v2.inkMuted, lineHeight: 20 }}>
        {t('habit.first.subtitle')}
      </Text>
      <View
        style={{
          marginTop: 16, padding: 14, borderRadius: 16,
          borderWidth: 1, borderStyle: 'dashed', borderColor: v2.hairlineStrong,
          backgroundColor: v2.bgSurface,
        }}
      >
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, lineHeight: 18 }}>
          {t('habit.first.deferCard')}
        </Text>
        <Pressable
          onPress={onDefer}
          disabled={busy}
          accessibilityRole="button"
          style={{
            marginTop: 12, paddingVertical: 12, borderRadius: 999,
            borderWidth: 1.5, borderColor: v2.ink, opacity: busy ? 0.5 : 1,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Ionicons name="notifications-outline" size={16} color={v2.ink} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
            {t(late ? 'habit.first.deferTomorrow' : 'habit.first.deferTonight')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
