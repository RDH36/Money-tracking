import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface SurveyChoiceProps {
  label: string;
  sublabel?: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

/** Option sélectionnable (radio) réutilisée pour chaque question du sondage. */
export function SurveyChoice({ label, sublabel, icon, selected, onPress }: SurveyChoiceProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14,
        backgroundColor: selected ? v2.brandSoft : v2.bgRaised,
        borderWidth: 1, borderColor: selected ? v2.brand + '66' : v2.hairline,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: selected ? v2.brandTint : v2.bgSurface,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={icon as IoniconName} size={17} color={selected ? v2.brand : v2.inkSubtle} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted, marginTop: 2 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          borderWidth: 1.5, borderColor: selected ? v2.brand : v2.hairlineStrong,
          backgroundColor: selected ? v2.brand : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {selected ? <Ionicons name="checkmark" size={12} color={v2.inkOnDark} /> : null}
      </View>
    </Pressable>
  );
}
