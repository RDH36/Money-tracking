import { View, Text, TextInput } from 'react-native';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';

/** Titre de section du formulaire de modification (même style que l'ajout). */
export function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  const v2 = useV2();
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
          textTransform: 'uppercase', color: v2.inkSubtle, marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

interface AmountFieldProps {
  value: string;
  onChangeText: (s: string) => void;
  currencySymbol: string;
}

export function AmountField({ value, onChangeText, currencySymbol }: AmountFieldProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: v2.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: v2.hairline,
        paddingHorizontal: 14, paddingVertical: 10,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={{
          flex: 1, fontFamily: v2.fontUI, fontSize: 18, fontWeight: '700', color: v2.ink,
          padding: 0, fontVariant: ['tabular-nums'],
        }}
      />
      <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkMuted }}>{currencySymbol}</Text>
    </View>
  );
}
