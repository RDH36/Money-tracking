import { View, Text, Pressable } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

export interface CurrencyChoice {
  code: string;
  symbol: string;
}

interface CurrencyPickerProps {
  options: CurrencyChoice[];
  selected: string;
  onSelect: (code: string) => void;
  label: string;
}

export function CurrencyPicker({ options, selected, onSelect, label }: CurrencyPickerProps) {
  const v2 = useV2();
  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
          letterSpacing: 1.4, textTransform: 'uppercase',
          color: v2.inkSubtle, marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {options.map((c) => {
          const active = selected === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => onSelect(c.code)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12,
                backgroundColor: active ? v2.bgInk : 'transparent',
                borderWidth: 1,
                borderColor: active ? v2.bgInk : v2.hairlineStrong,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: v2.fontDisplay, fontWeight: '700',
                  fontStyle: 'italic', fontSize: 16,
                  color: active ? v2.inkOnDark : v2.ink,
                  letterSpacing: -0.2,
                }}
              >
                {c.symbol}
              </Text>
              <Text
                style={{
                  marginTop: 1, fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                  letterSpacing: 0.4,
                  color: active ? v2.inkOnDarkM : v2.inkSubtle,
                }}
              >
                {c.code}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
