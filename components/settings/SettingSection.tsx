import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';

interface SettingSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingSection({ title, children }: SettingSectionProps) {
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');

  return (
    <View className="mb-6">
      {title && (
        <Text className="text-typography-500 text-xs font-medium uppercase tracking-wide px-4 mb-2">
          {title}
        </Text>
      )}
      <View className="rounded-xl overflow-hidden mx-4" style={{ backgroundColor: colors.cardBg }}>
        {children}
      </View>
    </View>
  );
}
