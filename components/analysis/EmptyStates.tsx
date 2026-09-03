import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { NavCta } from './controls';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  cta?: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

/** États « pas encore assez de données » et « cycle vide » : une phrase, un geste. */
export function EmptyState({ icon, title, message, cta }: EmptyStateProps) {
  const v2 = useV2();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={30} color={v2.inkSubtle} />
      {title ? (
        <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 17, color: v2.ink, textAlign: 'center' }}>{title}</Text>
      ) : null}
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, textAlign: 'center', maxWidth: 300, lineHeight: 18 }}>
        {message}
      </Text>
      {cta ? (
        <View style={{ alignSelf: 'stretch', marginTop: 10 }}>
          <NavCta v2={v2} label={cta.label} icon={cta.icon} onPress={cta.onPress} />
        </View>
      ) : null}
    </View>
  );
}
