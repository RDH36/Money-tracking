import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface AccountChipProps {
  /** Texte de la puce : nom du compte, ou « Compte → Contrepartie » pour un retrait. */
  label: string;
  /** Opération réglée via la feuille d'édition (retrait) ou bloquée : puce non appuyable ici. */
  disabled?: boolean;
  /** Retrait : puce qui ouvre la feuille d'édition (aucune flèche de liste). */
  transfer?: boolean;
  onPress: () => void;
}

/** Puce « par quel compte part la dépense », en bas de la carte d'une opération. */
export function AccountChip({ label, disabled = false, transfer = false, onPress }: AccountChipProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={t('ocrImport.accountChipA11y', { account: label })}
      style={{
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
        marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
        borderWidth: 1, borderColor: v2.hairlineStrong, backgroundColor: v2.bgBase,
      }}
    >
      <Ionicons name={transfer ? 'swap-horizontal' : 'wallet-outline'} size={12} color={v2.inkMuted} />
      <View style={{ flexShrink: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.ink }}>
          {label}
        </Text>
      </View>
      {!transfer && !disabled ? <Ionicons name="chevron-down" size={12} color={v2.inkMuted} /> : null}
    </Pressable>
  );
}
