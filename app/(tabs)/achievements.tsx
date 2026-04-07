import { View, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AchievementsTab } from '@/components/AchievementsTab';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-2">
        <RNText className="text-display-md font-display text-content-primary">
          {t('tabs.achievements')}
        </RNText>
      </View>
      <AchievementsTab />
    </View>
  );
}
