import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  /** Lignes max du titre (2 pour les titres longs en grande police). */
  titleLines?: number;
}

export function SettingsHeader({ title, subtitle, onBack, showBack = true, titleLines = 1 }: SettingsHeaderProps) {
  const v2 = useV2();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {showBack && onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={6}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: v2.bgSurface,
            borderWidth: 1, borderColor: v2.hairline,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color={v2.ink} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {subtitle ? (
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
              letterSpacing: 1.5, textTransform: 'uppercase',
              color: v2.inkSubtle, marginBottom: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text
          numberOfLines={titleLines}
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 28, color: v2.ink,
            letterSpacing: -0.6, lineHeight: 30,
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
