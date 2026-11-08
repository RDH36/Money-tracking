import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

/** Astuce sous le montant (écran d'ajout) — extraite telle quelle de add.tsx. */
export function AddTipCard({ text }: { text: string }) {
  const v2 = useV2();
  return (
    <View style={{ marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: v2.bgSurface,
                    borderWidth: 1, borderColor: v2.hairline, flexDirection: 'row',
                    alignItems: 'center', gap: 8 }}>
      <Ionicons name="bulb-outline" size={14} color={v2.brand} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
        {text}
      </Text>
    </View>
  );
}
