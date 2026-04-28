import { useEffect } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { CHANGELOG, CURRENT_VERSION } from '@/constants/changelog';
import { useWhatsNew } from '@/hooks';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<string, { icon: IoniconName; color: string }> = {
  added: { icon: 'add-circle', color: '#22C55E' },
  fixed: { icon: 'build', color: '#F59E0B' },
  improved: { icon: 'trending-up', color: '#3B82F6' },
};

export default function WhatsNewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const v2 = useV2();
  const { markSeen } = useWhatsNew();

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
              letterSpacing: 1.5, textTransform: 'uppercase',
              color: v2.inkSubtle, marginBottom: 2,
            }}
          >
            v{CURRENT_VERSION}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 28, color: v2.ink, letterSpacing: -0.6, lineHeight: 30,
            }}
          >
            {t('settings.whatsNew')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40, gap: 16 }}
      >
        {CHANGELOG.map((entry) => {
          const isCurrent = entry.version === CURRENT_VERSION;
          return (
            <View key={entry.version} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
                <View
                  style={{
                    paddingVertical: 4, paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: isCurrent ? v2.bgInk : v2.bgRaised,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
                      letterSpacing: 0.4,
                      color: isCurrent ? v2.inkOnDark : v2.inkMuted,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    v{entry.version}
                  </Text>
                </View>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
                  {entry.date}
                </Text>
                {isCurrent ? (
                  <View
                    style={{
                      paddingVertical: 3, paddingHorizontal: 8,
                      borderRadius: 999,
                      backgroundColor: v2.brandSoft,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                        letterSpacing: 0.4, color: v2.brandDeep,
                      }}
                    >
                      {t('changelog.current')}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={{
                  backgroundColor: v2.bgSurface,
                  borderWidth: 1,
                  borderColor: v2.hairline,
                  borderRadius: 14,
                  padding: 14,
                  gap: 10,
                }}
              >
                {entry.changes.map((change, idx) => (
                  <ChangeRow key={idx} v2={v2} type={change.type} text={t(change.key)} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface ChangeRowProps { v2: V2Tokens; type: keyof typeof TYPE_CONFIG; text: string; }
function ChangeRow({ v2, type, text }: ChangeRowProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.improved;
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 24, height: 24, borderRadius: 8,
          backgroundColor: config.color + '20',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1,
        }}
      >
        <Ionicons name={config.icon} size={14} color={config.color} />
      </View>
      <Text
        style={{
          flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '500',
          color: v2.ink, lineHeight: 18,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
