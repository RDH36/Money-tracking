import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsCard } from '@/components/settings/v2';

interface ExpectedIncomeFieldProps {
  value: string;
  onChange: (text: string) => void;
  currency: string;
  /** Ouvre le clavier à l'arrivée (lien « Modifier » du verdict). */
  autoFocus?: boolean;
}

/** Champ « Revenu habituel par mois » : montant entier en devise, optionnel. */
export function ExpectedIncomeField({ value, onChange, currency, autoFocus }: ExpectedIncomeFieldProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <SettingsCard>
      <View style={{ padding: 14, gap: 8 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.inkMuted }}>
          {t('settings.cycle.incomeLabel', { currency })}
        </Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          placeholder={t('settings.cycle.incomePlaceholder')}
          placeholderTextColor={v2.inkSubtle}
          style={{
            borderWidth: 1, borderColor: v2.hairlineStrong, borderRadius: 12,
            paddingVertical: 12, paddingHorizontal: 12, minHeight: 44,
            fontFamily: v2.fontUI, fontSize: 15, color: v2.ink,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 11, color: v2.inkSubtle, lineHeight: 15 }}>
          {t('settings.cycle.incomeHelp')}
        </Text>
      </View>
    </SettingsCard>
  );
}
