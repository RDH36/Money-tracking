import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { formatAmountDisplay } from '@/lib/amountInput';

interface AmountDisplayProps {
  value: string;
  onChangeText: (s: string) => void;
  currencyCode?: string;
}


export function AmountDisplay({
  value,
  onChangeText,
  currencyCode = 'Ar',
}: AmountDisplayProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const display = formatAmountDisplay(value);

  const [caretOn, setCaretOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setCaretOn((c) => !c), 500);
    return () => clearInterval(id);
  }, []);

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
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
        <View
          style={{
            width: 3,
            height: 44,
            marginLeft: 4,
            borderRadius: 2,
            backgroundColor: v2.brand,
            opacity: caretOn ? 1 : 0,
          }}
        />
      </View>
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
