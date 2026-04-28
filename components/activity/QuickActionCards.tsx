import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface QuickActionCardsProps {
  onReportsPress: () => void;
  onCalendarPress: () => void;
}

export function QuickActionCards({
  onReportsPress,
  onCalendarPress,
}: QuickActionCardsProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      <ActionCard
        v2={v2}
        icon="pulse"
        title={t('activity.reports')}
        sub={t('activity.reportsSub')}
        onPress={onReportsPress}
      />
      <ActionCard
        v2={v2}
        icon="calendar-outline"
        title={t('activity.calendar')}
        sub={t('activity.calendarSub')}
        onPress={onCalendarPress}
      />
    </View>
  );
}

interface ActionCardProps {
  v2: ReturnType<typeof useV2>;
  icon: IoniconName;
  title: string;
  sub: string;
  onPress: () => void;
}

function ActionCard({ v2, icon, title, sub, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: v2.bgInk,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: 'rgba(245,245,241,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={v2.inkOnDark} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: v2.fontUI,
            fontSize: 12,
            fontWeight: '700',
            color: v2.inkOnDark,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: v2.fontUI,
            fontSize: 10,
            color: v2.inkOnDarkM,
            marginTop: 1,
          }}
        >
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={v2.inkOnDarkM} />
    </Pressable>
  );
}
