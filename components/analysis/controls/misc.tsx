import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';

/** Ligne « Constat masqué · Annuler » — le rejet redevient réversible. */
export function DismissedLine({ onUndo }: { onUndo: () => void }) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
      }}
    >
      <Ionicons name="eye-off-outline" size={13} color={v2.inkSubtle} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>
        {t('analysis.hidden')}
      </Text>
      <Pressable onPress={onUndo} hitSlop={6}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.brand, fontWeight: '600' }}>
          {t('analysis.undo')}
        </Text>
      </Pressable>
    </View>
  );
}

/** CTA de navigation (openScreen) — pour les états sans revenu / cycle vide. */
export function NavCta({ v2, label, icon, onPress }: { v2: V2Tokens; label: string; icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: v2.brand, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}
    >
      <Ionicons name={icon} size={18} color={v2.inkOnDark} />
      <Text style={{ fontFamily: v2.fontUI, fontSize: 15, fontWeight: '700', color: v2.inkOnDark }}>{label}</Text>
    </Pressable>
  );
}
