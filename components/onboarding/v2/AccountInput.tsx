import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

/** Champ de solde d'un compte (écran « Combien tu as là, maintenant ? »). */
interface AccountInputProps {
  label: string;
  hint: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  currencyCode: string;
  amount: string;
  onChange: (s: string) => void;
  italicEmpty?: boolean;
}

export function AccountInput({
  label, hint, iconName, iconBg, iconColor,
  currencyCode, amount, onChange, italicEmpty,
}: AccountInputProps) {
  const v2 = useV2();
  const isEmpty = !amount;
  return (
    <View
      style={{
        padding: 16, backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 16, color: v2.ink, letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1,
            }}
          >
            {hint}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 0.6, color: v2.inkSubtle,
          }}
        >
          {currencyCode}
        </Text>
      </View>
      <View
        style={{
          paddingVertical: 14, paddingHorizontal: 14,
          backgroundColor: v2.bgRaised, borderRadius: 12,
          flexDirection: 'row', alignItems: 'baseline', gap: 8,
        }}
      >
        <TextInput
          placeholder="0"
          placeholderTextColor={v2.inkSubtle}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onChange}
          style={{
            flex: 1,
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontStyle: italicEmpty && isEmpty ? 'italic' : 'normal',
            fontSize: 28, color: isEmpty ? v2.inkSubtle : v2.ink,
            letterSpacing: -0.5, padding: 0,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkSubtle, fontWeight: '600',
          }}
        >
          {currencyCode}
        </Text>
      </View>
    </View>
  );
}
