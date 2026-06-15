import { View, Text, Image, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import type { OtherApp } from '@/constants/otherApps';

interface OtherAppCardProps {
  app: OtherApp;
}

export function OtherAppCard({ app }: OtherAppCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const released = !!app.storeUrl;

  const handleOpenStore = () => {
    posthog.capture('other_app_clicked', { target: app.id });
    Linking.openURL(app.storeUrl!);
  };

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1,
        borderColor: v2.hairline,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Image
        source={app.icon}
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: app.accent,
        }}
      />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: v2.fontDisplay, fontSize: 17, fontWeight: '700', color: v2.ink }}
        >
          {app.name}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 3, lineHeight: 16 }}
        >
          {t(app.taglineKey)}
        </Text>
      </View>

      {released ? (
        <Pressable
          onPress={handleOpenStore}
          hitSlop={6}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: app.accent,
            borderRadius: 12,
            paddingVertical: 9,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="download-outline" size={15} color="#FFFFFF" />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
            {t('otherApps.openStore')}
          </Text>
        </Pressable>
      ) : (
        <View
          style={{
            backgroundColor: v2.bgRaised,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.inkMuted }}>
            {t('otherApps.comingSoon')}
          </Text>
        </View>
      )}
    </View>
  );
}
