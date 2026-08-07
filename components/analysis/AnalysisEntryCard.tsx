import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

/**
 * Carte d'entrée pleine largeur sous le hero. Style volontairement DOUX
 * (surface neutre, pas d'aplat de couleur vive) : c'est une porte d'entrée
 * permanente, pas une alerte.
 */
export function AnalysisEntryCard({ onPress }: { onPress: () => void }) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 12, backgroundColor: v2.brandSoft,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="sparkles-outline" size={18} color={v2.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 15, color: v2.ink, letterSpacing: -0.2 }}>
          {t('analysis.entryTitle')}
        </Text>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 2 }}>
          {t('analysis.entrySubtitle')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={v2.inkSubtle} />
    </Pressable>
  );
}
