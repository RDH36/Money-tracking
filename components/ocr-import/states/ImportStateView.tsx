import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Action {
  label: string;
  onPress: () => void;
}

interface ImportStateViewProps {
  /** Sans icône : indicateur de chargement. */
  icon?: IoniconName;
  tone?: 'neutral' | 'good' | 'bad';
  title: string;
  body?: string;
  primary?: Action;
  secondary?: Action;
}

/** États plein écran de l'import : lecture, vide, erreur, terminé. */
export function ImportStateView({ icon, tone = 'neutral', title, body, primary, secondary }: ImportStateViewProps) {
  const v2 = useV2();
  const fg = tone === 'good' ? v2.good : tone === 'bad' ? v2.bad : v2.brand;
  const bg = tone === 'good' ? v2.goodSoft : tone === 'bad' ? v2.badSoft : v2.brandTint;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        {icon ? <Ionicons name={icon} size={28} color={fg} /> : <ActivityIndicator color={fg} />}
      </View>
      <Text
        style={{
          fontFamily: v2.fontDisplay, fontSize: 20, fontWeight: '700', color: v2.ink,
          textAlign: 'center', letterSpacing: -0.4,
        }}
      >
        {title}
      </Text>
      {body ? (
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20, color: v2.inkMuted, textAlign: 'center' }}>
          {body}
        </Text>
      ) : null}
      {primary ? (
        <Pressable
          onPress={primary.onPress}
          style={{
            marginTop: 8, alignSelf: 'stretch', backgroundColor: v2.bgInk, borderRadius: 14,
            paddingVertical: 15, alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.inkOnDark }}>
            {primary.label}
          </Text>
        </Pressable>
      ) : null}
      {secondary ? (
        <Pressable onPress={secondary.onPress} hitSlop={8} style={{ paddingVertical: 8 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.inkMuted }}>
            {secondary.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
