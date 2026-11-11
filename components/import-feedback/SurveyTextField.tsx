import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface SurveyTextFieldProps extends Pick<TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'maxLength' | 'multiline'> {
  label: string;
  /** Bordure rouge : le champ est en cause dans le message d'erreur. */
  invalid?: boolean;
  testID?: string;
}

/** Champ de saisie du sondage (mêmes codes que le sondage « sauvegarde cloud »). */
export function SurveyTextField({ label, invalid = false, multiline, maxLength, value, testID, ...input }: SurveyTextFieldProps) {
  const v2 = useV2();
  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
          textTransform: 'uppercase', color: v2.inkSubtle, marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
          borderWidth: 1, borderColor: invalid ? v2.bad : 'transparent',
        }}
      >
        <TextInput
          {...input}
          testID={testID}
          value={value}
          multiline={multiline}
          maxLength={maxLength}
          accessibilityLabel={label}
          placeholderTextColor={v2.inkSubtle}
          style={{
            fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0,
            ...(multiline ? { minHeight: 80, textAlignVertical: 'top' as const } : null),
          }}
        />
      </View>
      {multiline && maxLength ? (
        <Text
          style={{
            marginTop: 4, textAlign: 'right', fontFamily: v2.fontUI, fontSize: 10,
            color: v2.inkSubtle, fontVariant: ['tabular-nums'],
          }}
        >
          {(value ?? '').length} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
}
