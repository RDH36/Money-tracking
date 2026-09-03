import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsRadio } from '@/components/settings/v2';
import type { CycleMode } from '@/lib/analysis/types';

type IconName = keyof typeof Ionicons.glyphMap;

const MODES: { id: CycleMode; icon: IconName; tk: string; descKey: string }[] = [
  { id: 'payday', icon: 'calendar-outline', tk: 'settings.cycle.modePayday', descKey: 'settings.cycle.modePaydayDesc' },
  { id: 'irregular', icon: 'shuffle-outline', tk: 'settings.cycle.modeIrregular', descKey: 'settings.cycle.modeIrregularDesc' },
  { id: 'calendar', icon: 'today-outline', tk: 'settings.cycle.modeCalendar', descKey: 'settings.cycle.modeCalendarDesc' },
];

/** Trois cartes-options (jour fixe / irréguliers / fin de mois), une ligne d'explication chacune. */
export function CycleModeList({ mode, onChange }: { mode: CycleMode; onChange: (m: CycleMode) => void }) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      {MODES.map((m) => {
        const isActive = mode === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingVertical: 14, paddingHorizontal: 14, borderRadius: 16,
              backgroundColor: isActive ? v2.brandTint : v2.bgSurface,
              borderWidth: 1, borderColor: isActive ? v2.brand : v2.hairline,
            }}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 11,
                backgroundColor: isActive ? v2.brandSoft : v2.bgBase,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name={m.icon} size={18} color={isActive ? v2.brand : v2.inkMuted} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                  color: isActive ? v2.brandDeep : v2.ink,
                }}
              >
                {t(m.tk)}
              </Text>
              <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 12, lineHeight: 16, color: v2.inkMuted, marginTop: 3 }}>
                {t(m.descKey)}
              </Text>
            </View>
            <SettingsRadio value={isActive} />
          </Pressable>
        );
      })}
    </View>
  );
}
