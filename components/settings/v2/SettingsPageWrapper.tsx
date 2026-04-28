import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import { SettingsHeader } from './SettingsHeader';

interface SettingsPageWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SettingsPageWrapper({ title, subtitle, children }: SettingsPageWrapperProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const v2 = useV2();

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
        <SettingsHeader title={title} subtitle={subtitle} onBack={() => router.back()} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
