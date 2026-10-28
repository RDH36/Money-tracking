import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

/** Opérations d'exemple (inventées) affichées dans la maquette d'écran MCB. */
const SAMPLE = [
  { label: 'DB vente carte etrangere 482913 NETFLIX COM', ref: 'FT26073AB12C', amount: 'MGA -48 250,75', credit: false },
  { label: 'Virement recus Banque Confrere SOAVITA SARL', ref: 'FT26073XQ9KD', amount: 'MGA 1 850 000,00', credit: true },
];

/**
 * Illustration de la bonne capture : l'écran « Compte à vue › Transactions
 * récentes » de MCB Juice, redessiné (aucune vraie capture embarquée).
 * Le cadre de couleur montre la zone qui doit être visible.
 */
export function CaptureExample() {
  const v2 = useV2();
  const { t } = useTranslation();
  const small = { fontFamily: v2.fontUIRegular, fontSize: 9, color: v2.inkSubtle } as const;

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 230, borderRadius: 22, borderWidth: 1.5, borderColor: v2.hairlineStrong,
          backgroundColor: v2.bgSurface, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="arrow-back" size={12} color={v2.ink} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.ink }}>Compte à vue</Text>
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', color: v2.ink }}>Transactions récentes</Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 9, color: v2.brand }}>Tout afficher</Text>
        </View>

        <View
          style={{
            marginTop: 8, borderRadius: 10, borderWidth: 1.5, borderColor: v2.brand, borderStyle: 'dashed',
            paddingHorizontal: 8, paddingVertical: 6, gap: 7,
          }}
        >
          <Text style={small}>14 mars 2026</Text>
          {SAMPLE.map((op) => (
            <View key={op.ref} style={{ gap: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 9, color: v2.ink }}>{op.label}</Text>
              <Text style={small}>{`Ref: ${op.ref}\\BNK`}</Text>
              <Text
                style={{
                  alignSelf: 'flex-end', fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                  color: op.credit ? v2.good : v2.ink,
                }}
              >
                {op.amount}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ marginTop: 8, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted, textAlign: 'center' }}>
        {t('ocrImport.example.caption')}
      </Text>
    </View>
  );
}
