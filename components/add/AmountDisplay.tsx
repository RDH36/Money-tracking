import { useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface AmountDisplayProps {
  value: string;
  onChangeText: (s: string) => void;
  currencyCode?: string;
}

function formatDisplay(raw: string, locale: string): string {
  const tag = locale.startsWith('en') ? 'en-US' : locale.startsWith('mg') ? 'mg-MG' : 'fr-FR';
  const fmt = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 });
  if (!raw) return '0';
  const trimmed = raw.endsWith('.') || raw.endsWith(',') ? raw.slice(0, -1) : raw;
  const num = Number(trimmed.replace(',', '.'));
  if (Number.isNaN(num)) return '0';
  if (raw.includes('.') || raw.includes(',')) {
    const [intPart, decPart] = raw.replace(',', '.').split('.');
    const formattedInt = fmt.format(Number(intPart || '0'));
    return decPart !== undefined ? `${formattedInt},${decPart}` : `${formattedInt},`;
  }
  return fmt.format(num);
}

export function AmountDisplay({
  value,
  onChangeText,
  currencyCode = 'Ar',
}: AmountDisplayProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const display = formatDisplay(value, i18n.language);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={{
        marginTop: 28,
        marginBottom: 10,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 6,
        }}
      >
        {t('add.amount')} · {currencyCode}
      </Text>
      <Text
        style={{
          fontFamily: v2.fontDisplay,
          fontWeight: '700',
          fontSize: 56,
          color: v2.ink,
          letterSpacing: -2,
          lineHeight: 60,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}
      >
        {display}
      </Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        autoFocus
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
        }}
      />
      <View
        style={{
          marginTop: 10,
          height: 1,
          backgroundColor: v2.hairlineStrong,
          alignSelf: 'stretch',
          marginHorizontal: 30,
        }}
      />
    </Pressable>
  );
}
