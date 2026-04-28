import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface DashboardHeaderProps {
  dateLabel: string;
  hasNotification?: boolean;
  onNotificationPress?: () => void;
  onAchievementsPress?: () => void;
}

export function DashboardHeader({
  dateLabel,
  hasNotification = false,
  onNotificationPress,
  onAchievementsPress,
}: DashboardHeaderProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: v2.inkSubtle,
            marginBottom: 2,
          }}
        >
          {dateLabel}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontDisplay,
            fontWeight: '700',
            fontSize: 28,
            color: v2.ink,
            letterSpacing: -0.8,
            lineHeight: 30,
          }}
        >
          Mitsitsy
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onNotificationPress}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: v2.bgSurface,
            borderWidth: 1,
            borderColor: v2.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={18} color={v2.inkMuted} />
          {hasNotification ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 9,
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: v2.bad,
                borderWidth: 1.5,
                borderColor: v2.bgSurface,
              }}
            />
          ) : null}
        </Pressable>
        <Pressable
          onPress={onAchievementsPress}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: v2.bgSurface,
            borderWidth: 1,
            borderColor: v2.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trophy-outline" size={18} color={v2.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}
