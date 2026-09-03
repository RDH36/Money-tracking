import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsCard } from '@/components/settings/v2';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
/** Cible tactile minimale. */
const CHIP = 44;

/** Grille de chips 1–31 pour choisir le jour de paye (pas de picker natif). */
export function PayDayGrid({ value, onChange }: { value: number | null; onChange: (day: number) => void }) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <SettingsCard>
      <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DAYS.map((day) => {
          const active = day === value;
          return (
            <Pressable
              key={day}
              onPress={() => onChange(day)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                width: CHIP, height: CHIP, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? v2.bgInk : v2.bgBase,
                borderWidth: 1, borderColor: active ? v2.bgInk : v2.hairline,
              }}
            >
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                  color: active ? v2.inkOnDark : v2.ink,
                }}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text
        style={{
          fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkSubtle,
          paddingHorizontal: 14, paddingBottom: 12, lineHeight: 15,
        }}
      >
        {t('settings.cycle.dayHelp')}
      </Text>
    </SettingsCard>
  );
}
