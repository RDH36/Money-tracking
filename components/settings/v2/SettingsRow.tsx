import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface SettingsRowProps {
  icon?: IoniconName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  sublabel?: string;
  value?: string;
  right?: ReactNode;
  isLast?: boolean;
  danger?: boolean;
  badge?: boolean;
  onPress?: () => void;
}

function alpha15(hex: string): string {
  if (hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

export function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  value,
  right,
  isLast = false,
  danger = false,
  badge = false,
  onPress,
}: SettingsRowProps) {
  const v2 = useV2();
  const Wrapper: any = onPress ? Pressable : View;
  const labelColor = danger ? v2.bad : v2.ink;
  const ic = iconColor ?? (danger ? v2.bad : v2.brand);
  const ibg = iconBg ?? alpha15(ic);

  const showDefaultChevron = right === undefined && onPress;

  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: v2.hairline,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 32, height: 32, borderRadius: 9,
            backgroundColor: ibg,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Ionicons name={icon} size={16} color={ic} />
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600',
              color: labelColor, lineHeight: 17, flexShrink: 1,
            }}
          >
            {label}
          </Text>
          {badge ? (
            <View
              style={{
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: v2.bad,
              }}
            />
          ) : null}
        </View>
        {sublabel ? (
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11, fontWeight: '500',
              color: v2.inkSubtle, marginTop: 2, lineHeight: 14,
            }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600',
            color: v2.inkMuted, fontVariant: ['tabular-nums'],
          }}
        >
          {value}
        </Text>
      ) : null}

      {right !== undefined ? right : null}

      {showDefaultChevron ? (
        <Ionicons name="chevron-forward" size={14} color={v2.inkSubtle} />
      ) : null}
    </Wrapper>
  );
}
