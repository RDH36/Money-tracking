import { useEffect } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import { OTHER_APPS } from '@/constants/otherApps';
import { OtherAppCard } from '@/components/other-apps';

export default function OtherAppsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const v2 = useV2();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('other_apps_viewed');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
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
          <Ionicons name="chevron-back" size={18} color={v2.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: v2.inkSubtle,
              marginBottom: 2,
            }}
          >
            {t('otherApps.overline')}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontDisplay,
              fontWeight: '700',
              fontSize: 26,
              color: v2.ink,
              letterSpacing: -0.6,
              lineHeight: 30,
            }}
          >
            {t('otherApps.title')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40, gap: 12 }}
      >
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 13,
            color: v2.inkMuted,
            paddingHorizontal: 4,
            marginBottom: 4,
            lineHeight: 19,
          }}
        >
          {t('otherApps.subtitle')}
        </Text>
        {OTHER_APPS.map((app) => (
          <OtherAppCard key={app.id} app={app} />
        ))}
      </ScrollView>
    </View>
  );
}
