import { Stack } from 'expo-router';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { DatabaseProvider } from '@/lib/database/sqlite';
import { ThemeProvider } from '@/contexts';
import '@/global.css';

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <Suspense fallback={<LoadingFallback />}>
        <DatabaseProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ThemeProvider>
        </DatabaseProvider>
      </Suspense>
    </GluestackUIProvider>
  );
}
