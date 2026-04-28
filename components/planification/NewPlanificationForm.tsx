import { useState } from 'react';
import { View, Text, Pressable, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface NewPlanificationFormProps {
  onCreate: (title: string, deadline: Date | null) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function NewPlanificationForm({
  onCreate,
  onCancel,
  isLoading = false,
}: NewPlanificationFormProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDeadline(selectedDate);
  };

  const submit = async () => {
    if (!title.trim()) return;
    await onCreate(title.trim(), deadline);
  };

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1,
        borderColor: v2.hairline,
        borderRadius: 18,
        padding: 16,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
        }}
      >
        {t('planification.new')}
      </Text>

      <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
        <TextInput
          placeholder={t('planification.placeholder')}
          placeholderTextColor={v2.inkSubtle}
          value={title}
          onChangeText={setTitle}
          autoFocus
          style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
        />
      </View>

      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: v2.bgRaised,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Ionicons name="calendar-outline" size={16} color={v2.brand} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink }}>
          {deadline ? formatDate(deadline, i18n.language) : t('planification.chooseDate')}
        </Text>
        {deadline ? (
          <Pressable onPress={() => setDeadline(null)} hitSlop={6}>
            <Ionicons name="close-circle" size={18} color={v2.inkSubtle} />
          </Pressable>
        ) : null}
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={deadline || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={onCancel}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: v2.hairlineStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={!title.trim() || isLoading}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: v2.bgInk,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !title.trim() || isLoading ? 0.5 : 1,
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
            {t('planification.create')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
