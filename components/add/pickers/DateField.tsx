import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useV2 } from '@/constants/designTokensV2';

interface DateFieldProps {
  date: Date;
  onChange: (d: Date) => void;
  label: string;
  todayLabel: string;
  yesterdayLabel: string;
  locale: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DateField({
  date,
  onChange,
  label,
  todayLabel,
  yesterdayLabel,
  locale,
}: DateFieldProps) {
  const v2 = useV2();
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = isSameDay(date, today);
  const isYesterday = isSameDay(date, yesterday);

  const display = isToday
    ? todayLabel
    : isYesterday
      ? yesterdayLabel
      : date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  // Never allow a future date: a transaction can't have happened yet.
  const handleChange = (_: unknown, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) onChange(selected);
  };

  const chip = (active: boolean, text: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: active ? v2.brandTint : v2.bgRaised,
        borderWidth: 1,
        borderColor: active ? v2.brand : v2.hairline,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 12,
          fontWeight: '600',
          color: active ? v2.brand : v2.inkMuted,
        }}
      >
        {text}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: v2.bgSurface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: v2.hairline,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: v2.brandTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={v2.brand} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: v2.fontUI,
            fontSize: 14,
            fontWeight: '600',
            color: v2.ink,
            textTransform: 'capitalize',
          }}
        >
          {display}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={v2.inkSubtle} />
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {chip(isToday, todayLabel, () => onChange(new Date()))}
        {chip(isYesterday, yesterdayLabel, () => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          onChange(d);
        })}
      </View>

      {showPicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
