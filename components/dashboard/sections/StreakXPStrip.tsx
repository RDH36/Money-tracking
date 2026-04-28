import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { Progress } from '../Progress';

interface StreakXPStripProps {
  streakDays: number;
  level: number;
  totalXP: number;
  xpProgressPct: number;
  xpDelta?: number;
  onPress?: () => void;
}

export function StreakXPStrip({
  streakDays,
  level,
  totalXP,
  xpProgressPct,
  xpDelta,
  onPress,
}: StreakXPStripProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: v2.warnSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="flame" size={15} color={v2.warn} />
        </View>
        <View>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              color: v2.inkSubtle,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontWeight: '600',
            }}
          >
            {t('dashboard.streak')}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 14,
              fontWeight: '700',
              color: v2.ink,
              marginTop: 1,
            }}
          >
            {t('dashboard.streakDays', { count: streakDays })}
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1.4,
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              color: v2.inkSubtle,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontWeight: '600',
              flexShrink: 1,
            }}
          >
            {t('dashboard.level')} {level} · {totalXP} XP
          </Text>
          {xpDelta !== undefined ? (
            <Text
              style={{
                fontFamily: v2.fontUI,
                fontSize: 10,
                color: v2.brand,
                fontWeight: '600',
                marginLeft: 6,
              }}
            >
              +{xpDelta} XP
            </Text>
          ) : null}
        </View>
        <Progress value={xpProgressPct} height={4} color={v2.brand} />
      </View>
    </Container>
  );
}
