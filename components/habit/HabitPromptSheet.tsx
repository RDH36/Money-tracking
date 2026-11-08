import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonStack, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { SettingsRadio } from '@/components/settings/v2';
import { useV2 } from '@/constants/designTokensV2';
import type { ReminderFrequency } from '@/lib/notifications';
import { useHabitPrompt } from '@/hooks/habit/useHabitPrompt';

const OPTIONS: { id: ReminderFrequency; tk: string; descKey?: string }[] = [
  { id: 'evening', tk: 'habit.prompt.keep', descKey: 'habit.prompt.keepDesc' },
  { id: '4h', tk: 'notificationsV2.freq4h' },
  { id: '2h', tk: 'notificationsV2.freq2h' },
  { id: '1h', tk: 'notificationsV2.freq1h' },
];

/** « 3 jours de saisie » : proposition unique d'un rappel plus fréquent. */
export function HabitPromptSheet({ blocked }: { blocked: boolean }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const { open, submit } = useHabitPrompt(blocked);
  const [choice, setChoice] = useState<ReminderFrequency>('evening');
  useEffect(() => { if (open) setChoice('evening'); }, [open]);

  return (
    <BottomSheet
      isOpen={open}
      onClose={() => submit('evening')}
      overline={t('habit.prompt.overline')}
      title={t('habit.prompt.title')}
      footer={
        <DialogButtonStack>
          <DialogPrimaryBtn label={t('habit.prompt.validate')} onPress={() => submit(choice)} />
        </DialogButtonStack>
      }
    >
      <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 17, color: v2.ink }}>
        {t('habit.prompt.question')}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: v2.fontUI, fontSize: 13, lineHeight: 18, color: v2.inkMuted }}>
        {t('habit.prompt.body')}
      </Text>
      <View style={{ marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: v2.hairline, overflow: 'hidden' }}>
        {OPTIONS.map((o, i) => {
          const active = choice === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => setChoice(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14,
                backgroundColor: active ? v2.brandTint : 'transparent',
                borderBottomWidth: i === OPTIONS.length - 1 ? 0 : 1, borderBottomColor: v2.hairline,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: active ? v2.brandDeep : v2.ink }}>
                  {t(o.tk)}
                </Text>
                {o.descKey ? (
                  <Text style={{ marginTop: 2, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>{t(o.descKey)}</Text>
                ) : null}
              </View>
              <SettingsRadio value={active} />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
