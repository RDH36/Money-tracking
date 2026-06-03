import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface AppLockBannerProps {
  onPress: () => void;
  onDismiss: () => void;
}

/** Promo banner inviting the user to enable the app lock (shown when off). */
export function AppLockBanner({ onPress, onDismiss }: AppLockBannerProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: v2.brandSoft,
        borderWidth: 1,
        borderColor: v2.brand + '33',
        borderRadius: 14,
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 8,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: v2.brandTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="shield-checkmark" size={20} color={v2.brand} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}
        >
          {t('privacyV2.bannerTitle')}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted, marginTop: 2 }}
        >
          {t('privacyV2.bannerSubtitle')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Ionicons name="chevron-forward" size={16} color={v2.brand} />
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={16} color={v2.inkSubtle} />
        </Pressable>
      </View>
    </Pressable>
  );
}
