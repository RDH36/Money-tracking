import React, { useEffect, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { rawConfig, vars, generateSecondaryColors } from './config';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme } from 'nativewind';
import { useSettingsStore } from '@/stores/settingsStore';
import { getDarkModeColors } from '@/constants/darkMode';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  ...props
}: {
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { setColorScheme } = useColorScheme();
  const systemColorScheme = useSystemColorScheme();
  const theme = useSettingsStore((state) => state.theme);
  const colorMode = useSettingsStore((state) => state.colorMode);

  // Determine actual color scheme based on user preference
  const effectiveColorScheme = useMemo(() => {
    if (colorMode === 'system') {
      return systemColorScheme ?? 'light';
    }
    return colorMode;
  }, [colorMode, systemColorScheme]);

  useEffect(() => {
    setColorScheme(effectiveColorScheme);
  }, [effectiveColorScheme, setColorScheme]);

  const isDark = effectiveColorScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const dynamicStyles = useMemo(() => {
    const baseConfig = rawConfig[effectiveColorScheme];
    const secondaryColors = generateSecondaryColors(theme.colors.secondary, isDark);

    return vars({
      ...baseConfig,
      ...secondaryColors,
    });
  }, [effectiveColorScheme, theme.colors.secondary, isDark]);

  return (
    <View
      style={[
        dynamicStyles,
        { flex: 1, height: '100%', width: '100%', backgroundColor: colors.background },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}

// Export hook for components that need to know the current effective color scheme
export function useEffectiveColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const colorMode = useSettingsStore((state) => state.colorMode);

  if (colorMode === 'system') {
    return systemColorScheme ?? 'light';
  }
  return colorMode;
}
