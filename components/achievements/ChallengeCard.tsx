import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ChallengeCardProps {
  kind: string;
  label: string;
  desc?: string;
  xp: number;
  color: string;
  icon: IoniconName;
  completed: boolean;
  progress?: number;
  target?: number;
}

export function ChallengeCard({
  kind, label, desc, xp, color, icon, completed, progress, target,
}: ChallengeCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const tone = completed ? v2.good : color;
  const showProgress = !completed && typeof progress === 'number' && typeof target === 'number' && target > 1;
  const pct = showProgress && target! > 0 ? Math.min((progress! / target!) * 100, 100) : 0;

  return (
    <View
      style={{
        backgroundColor: completed ? v2.goodSoft : color + '12',
        borderWidth: 1,
        borderColor: tone + '40',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: completed ? v2.good + '30' : color + '24',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={completed ? 'checkmark' : icon}
          size={18}
          color={tone}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                letterSpacing: 1.4, textTransform: 'uppercase',
                color: tone,
              }}
            >
              {kind}
            </Text>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                color: v2.ink, lineHeight: 18, marginTop: 1,
              }}
            >
              {label}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 13, fontWeight: '800',
              color: tone, fontVariant: ['tabular-nums'],
            }}
          >
            +{xp}
          </Text>
        </View>

        {desc ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 4, lineHeight: 16 }}>
            {desc}
          </Text>
        ) : null}

        {showProgress ? (
          <View style={{ marginTop: 10 }}>
            <View style={{ height: 5, borderRadius: 999, backgroundColor: v2.hairline, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
                {t('achievements.progressLabel')}
              </Text>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.ink, fontVariant: ['tabular-nums'] }}>
                {progress} / {target}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
