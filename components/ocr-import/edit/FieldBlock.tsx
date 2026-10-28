import { View, Text, TextInput } from 'react-native';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import { formatAmountInput } from '@/lib/amountInput';

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

/** Séparateurs de la devise (« 1 111,1 » en fr-MG, « 1,111.1 » en en-US). */
function separators(locale: string): { group: string; decimal: string } {
  const sample = (1111.1).toLocaleString(locale, { minimumFractionDigits: 1 });
  return { group: sample.length === 7 ? sample.charAt(1) : '', decimal: sample.charAt(sample.length - 2) };
}

/** Valeur brute (« 70540.53 ») → affichage local (« 70 540,53 »). */
function toDisplay(raw: string, locale: string): string {
  const { group, decimal } = separators(locale);
  const [int, dec] = raw.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return dec === undefined ? grouped : `${grouped}${decimal}${dec}`;
}

/** Saisie au format local → valeur brute avec un point décimal. */
function fromDisplay(text: string, locale: string): string {
  const { group, decimal } = separators(locale);
  let s = group ? text.split(group).join('') : text;
  s = s.replace(/\s/g, '');
  if (decimal !== '.') s = s.split(decimal).join('.');
  return formatAmountInput(s);
}

interface AmountFieldProps {
  /** Valeur brute, point décimal (format de `formatAmountInput`). */
  value: string;
  onChangeText: (raw: string) => void;
  currencySymbol: string;
  /** Locale de la devise : séparateurs affichés. */
  locale: string;
}

export function AmountField({ value, onChangeText, currencySymbol, locale }: AmountFieldProps) {
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
        value={toDisplay(value, locale)}
        onChangeText={(text) => onChangeText(fromDisplay(text, locale))}
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
