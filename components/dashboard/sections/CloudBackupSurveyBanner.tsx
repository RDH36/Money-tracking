import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface CloudBackupSurveyBannerProps {
  onPress: () => void;
  onDismiss: () => void;
}

/** Bannière invitant l'utilisateur à donner son avis sur la sauvegarde cloud. */
export function CloudBackupSurveyBanner({ onPress, onDismiss }: CloudBackupSurveyBannerProps) {
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
        <Ionicons name="cloud-upload" size={20} color={v2.brand} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}
        >
          {t('cloudSurvey.bannerTitle')}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted, marginTop: 2 }}
        >
          {t('cloudSurvey.bannerSubtitle')}
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
