import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface ManageCategoriesLinkProps {
  onPress: () => void;
}

export function ManageCategoriesLink({ onPress }: ManageCategoriesLinkProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="settings-outline" size={14} color={v2.brand} />
      <Text
        style={{
          flex: 1,
          fontFamily: v2.fontUI,
          fontSize: 12,
          fontWeight: '600',
          color: v2.brand,
        }}
      >
        {t('activity.manageCategories')}
      </Text>
      <Ionicons name="chevron-forward" size={12} color={v2.brand} />
    </Pressable>
  );
}
