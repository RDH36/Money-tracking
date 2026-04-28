import { View, Text, TextInput } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface NoteFieldProps {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  label: string;
  maxLength?: number;
}

export function NoteField({
  value,
  onChangeText,
  placeholder,
  label,
  maxLength = 100,
}: NoteFieldProps) {
  const v2 = useV2();
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
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: v2.hairline,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={v2.inkSubtle}
          maxLength={maxLength}
          multiline
          style={{
            fontFamily: v2.fontUI,
            fontSize: 13,
            color: v2.ink,
            padding: 0,
            minHeight: 22,
          }}
        />
      </View>
      <Text
        style={{
          marginTop: 6,
          fontFamily: v2.fontUI,
          fontSize: 10,
          color: v2.inkSubtle,
          textAlign: 'right',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value.length} / {maxLength}
      </Text>
    </View>
  );
}
