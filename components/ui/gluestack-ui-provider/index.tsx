import React, { useEffect, useMemo } from 'react';
import { rawConfig, vars, generateSecondaryColors } from './config';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme } from 'nativewind';
import { useSettingsStore } from '@/stores/settingsStore';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    setColorScheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const dynamicStyles = useMemo(() => {
    const isDark = colorScheme === 'dark';
    const baseConfig = rawConfig[colorScheme ?? 'light'];
    const secondaryColors = generateSecondaryColors(theme.colors.secondary, isDark);

    return vars({
      ...baseConfig,
      ...secondaryColors,
    });
  }, [colorScheme, theme.colors.secondary]);

  return (
    <View
      style={[
        dynamicStyles,
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
