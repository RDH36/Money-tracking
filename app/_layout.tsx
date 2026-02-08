import { Stack } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GluestackUIProvider, useEffectiveColorScheme } from "@/components/ui/gluestack-ui-provider";
import { ThemeProvider, LanguageProvider } from "@/contexts";
import "@/global.css";
import { DatabaseProvider } from "@/lib/database/sqlite";
import { getDarkModeColors } from "@/constants/darkMode";

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

function AppContent() {
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="planification/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <GluestackUIProvider>
        <Suspense fallback={<LoadingFallback />}>
          <DatabaseProvider>
            <LanguageProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </LanguageProvider>
          </DatabaseProvider>
        </Suspense>
      </GluestackUIProvider>
    </KeyboardProvider>
  );
}
