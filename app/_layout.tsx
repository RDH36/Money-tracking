import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import { Suspense, useEffect, useRef } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PostHogProvider } from "posthog-react-native";

import { GluestackUIProvider, useEffectiveColorScheme } from "@/components/ui/gluestack-ui-provider";
import { ThemeProvider, LanguageProvider } from "@/contexts";
import "@/global.css";
import { DatabaseProvider } from "@/lib/database/sqlite";
import { getBgBaseHex } from "@/constants/designTokens";
import { posthog } from "@/lib/posthog";
import { LockGate } from "@/components/lock";

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#121216' }}>
      <ActivityIndicator size="large" color="#F0F0F5" />
    </View>
  );
}

function AppContent() {
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const bgColor = getBgBaseHex(isDark);

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: bgColor,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="planification/[id]" />
        <Stack.Screen name="whats-new" />
        <Stack.Screen name="other-apps" />
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
      <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <GluestackUIProvider>
          <Suspense fallback={<LoadingFallback />}>
            <DatabaseProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <ScreenTracker />
                  <LockGate>
                    <AppContent />
                  </LockGate>
                </ThemeProvider>
              </LanguageProvider>
            </DatabaseProvider>
          </Suspense>
        </GluestackUIProvider>
      </KeyboardProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}
