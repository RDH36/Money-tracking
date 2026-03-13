import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import { Suspense, useEffect, useRef } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { PostHogProvider } from "posthog-react-native";

import { GluestackUIProvider, useEffectiveColorScheme } from "@/components/ui/gluestack-ui-provider";
import { ThemeProvider, LanguageProvider } from "@/contexts";
import "@/global.css";
import { DatabaseProvider } from "@/lib/database/sqlite";
import { getDarkModeColors } from "@/constants/darkMode";
import { posthog } from "@/lib/posthog";

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
        <Stack.Screen name="whats-new" />
      </Stack>
    </>
  );
}

function ScreenTracker() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  return null;
}

export default function RootLayout() {
  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ['testID'],
        maxElementsCaptured: 20,
      }}
    >
      <KeyboardProvider>
        <GluestackUIProvider>
          <Suspense fallback={<LoadingFallback />}>
            <DatabaseProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <ScreenTracker />
                  <AppContent />
                </ThemeProvider>
              </LanguageProvider>
            </DatabaseProvider>
          </Suspense>
        </GluestackUIProvider>
      </KeyboardProvider>
    </PostHogProvider>
  );
}
