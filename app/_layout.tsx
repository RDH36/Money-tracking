import { Stack } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { ThemeProvider, LanguageProvider } from "@/contexts";
import "@/global.css";
import { DatabaseProvider } from "@/lib/database/sqlite";

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <GluestackUIProvider>
        <StatusBar barStyle="dark-content" />
        <Suspense fallback={<LoadingFallback />}>
          <DatabaseProvider>
            <LanguageProvider>
            <ThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="tutorial" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="planification/[id]" />
              </Stack>
            </ThemeProvider>
            </LanguageProvider>
          </DatabaseProvider>
        </Suspense>
      </GluestackUIProvider>
    </KeyboardProvider>
  );
}
