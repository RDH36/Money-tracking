import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { ReminderFrequency } from '@/lib/notifications';
import {
  SectionLabel,
  SettingsCard,
  SettingsRow,
  SettingsRadio,
  SettingsToggle,
} from '@/components/settings/v2';

interface NotificationsSectionProps {
  reminderFrequency: ReminderFrequency;
  onReminderChange: (value: ReminderFrequency) => void;
}

const FREQUENCIES: { id: ReminderFrequency; tk: string; descKey: string }[] = [
  { id: 'off', tk: 'notificationsV2.freqOff', descKey: 'notificationsV2.freqOffDesc' },
  { id: '1h', tk: 'notificationsV2.freq1h', descKey: 'notificationsV2.freq1hDesc' },
  { id: '2h', tk: 'notificationsV2.freq2h', descKey: 'notificationsV2.freq2hDesc' },
  { id: '4h', tk: 'notificationsV2.freq4h', descKey: 'notificationsV2.freq4hDesc' },
];

export function NotificationsSection({ reminderFrequency, onReminderChange }: NotificationsSectionProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [t50, setT50] = useState(false);
  const [t80, setT80] = useState(true);
  const [t100, setT100] = useState(true);

  return (
    <View>
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          paddingVertical: 20, paddingHorizontal: 18,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', right: -20, top: -20,
            width: 110, height: 110, borderRadius: 55,
            backgroundColor: v2.warn + '14',
          }}
        />
        <View
          style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: v2.warn + '24',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons name="notifications-outline" size={22} color={v2.warn} />
        </View>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontSize: 22,
            color: v2.ink, letterSpacing: -0.5, lineHeight: 26,
          }}
        >
          {t('notificationsV2.heroTitle')}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted,
            marginTop: 6, lineHeight: 17,
          }}
        >
          {t('notificationsV2.heroDesc')}
        </Text>
      </View>

      <SectionLabel>{t('notificationsV2.frequencySection')}</SectionLabel>
      <SettingsCard>
        {FREQUENCIES.map((f, i) => {
          const isActive = reminderFrequency === f.id;
          const isLast = i === FREQUENCIES.length - 1;
          return (
            <Pressable
              key={f.id}
              onPress={() => onReminderChange(f.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 14,
                backgroundColor: isActive ? v2.brandTint : 'transparent',
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: v2.hairline,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                    color: isActive ? v2.brandDeep : v2.ink,
                  }}
                >
                  {t(f.tk)}
                </Text>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, marginTop: 3 }}>
                  {t(f.descKey)}
                </Text>
              </View>
              <SettingsRadio value={isActive} />
            </Pressable>
          );
        })}
      </SettingsCard>

      <SectionLabel>{t('notificationsV2.budgetAlertsSection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="warning-outline"
          iconColor={v2.warn}
          label={t('notificationsV2.threshold50')}
          sublabel={t('notificationsV2.threshold50Sub')}
          right={<SettingsToggle value={t50} onChange={setT50} />}
        />
        <SettingsRow
          icon="warning-outline"
          iconColor={v2.warn}
          label={t('notificationsV2.threshold80')}
          sublabel={t('notificationsV2.threshold80Sub')}
          right={<SettingsToggle value={t80} onChange={setT80} />}
        />
        <SettingsRow
          icon="warning"
          iconColor={v2.bad}
          label={t('notificationsV2.thresholdLimit')}
          sublabel={t('notificationsV2.thresholdLimitSub')}
          right={<SettingsToggle value={t100} onChange={setT100} />}
          isLast
        />
      </SettingsCard>

      <View
        style={{
          marginTop: 14, padding: 14,
          borderRadius: 14,
          backgroundColor: v2.warnSoft,
          borderWidth: 1, borderColor: v2.warn + '40',
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={15} color={v2.warn} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.warn, lineHeight: 17 }}>
          {t('notificationsV2.perCategoryHint')}
        </Text>
      </View>
    </View>
  );
}
