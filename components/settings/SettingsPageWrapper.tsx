import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';

interface SettingsPageWrapperProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsPageWrapper({ title, children }: SettingsPageWrapperProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text className="font-display text-display-md text-content-primary">{title}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {children}
      </ScrollView>
    </View>
  );
}
