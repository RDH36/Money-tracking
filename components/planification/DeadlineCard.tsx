import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface DeadlineCardProps {
  deadline: string | null;
  expired: boolean;
  formatDate: (dateStr: string) => string;
  onChange: (date: Date) => void;
  onRemove: () => void;
}

export function DeadlineCard({
  deadline, expired, formatDate, onChange, onRemove,
}: DeadlineCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_: unknown, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) onChange(selectedDate);
  };

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 14, padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View
            style={{
              width: 36, height: 36, borderRadius: 11,
              backgroundColor: expired ? v2.badSoft : v2.brandTint,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="calendar-outline" size={18} color={expired ? v2.bad : v2.brand} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: v2.inkSubtle, marginBottom: 2,
              }}
            >
              {t('planification.deadline')}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600',
                color: expired ? v2.bad : deadline ? v2.ink : v2.inkSubtle,
              }}
            >
              {deadline
                ? `${formatDate(deadline)}${expired ? ` · ${t('planification.expired')}` : ''}`
                : t('planification.notDefined')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: v2.bgRaised,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="create-outline" size={16} color={v2.brand} />
          </Pressable>
          {deadline ? (
            <Pressable
              onPress={onRemove}
              style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: v2.bgRaised,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={v2.inkSubtle} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {showPicker ? (
        <DateTimePicker
          value={deadline ? new Date(deadline) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
