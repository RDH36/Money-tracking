import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** Bouton plein 52 px (maquette) : sombre par défaut, `brand` pour l'action de confirmation. */
export function IntroPrimaryButton({ label, onPress, disabled = false, tone = 'ink' }: ButtonProps & { tone?: 'ink' | 'brand' }) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: tone === 'brand' ? v2.brand : v2.bgInk,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 15, color: v2.inkOnDark }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Bouton secondaire 46 px, bordure fine, texte encre. */
export function IntroSecondaryButton({ label, onPress, disabled = false }: ButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: v2.hairlineStrong, paddingHorizontal: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        numberOfLines={2}
        style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.ink, textAlign: 'center' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Lien texte centré (« Plus tard »). */
export function IntroTextLink({ label, onPress }: ButtonProps) {
  const v2 = useV2();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ padding: 8, alignItems: 'center' }}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '500', color: v2.inkMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Rangée de boutons secondaires côte à côte. */
export function IntroButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}
