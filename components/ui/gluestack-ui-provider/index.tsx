import React, { useEffect, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { buildDesignVars } from './config';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme } from 'nativewind';
import { useSettingsStore } from '@/stores/settingsStore';
import { getBgBaseHex } from '@/constants/designTokens';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  ...props
}: {
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { setColorScheme } = useColorScheme();
  const systemColorScheme = useSystemColorScheme();
  const themeId = useSettingsStore((state) => state.themeId);
  const colorMode = useSettingsStore((state) => state.colorMode);

  const effectiveColorScheme = useMemo(() => {
    if (colorMode === 'system') {
      // RN 0.83 can report 'unspecified': treat it like null (light).
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return colorMode;
  }, [colorMode, systemColorScheme]);

  useEffect(() => {
    setColorScheme(effectiveColorScheme);
  }, [effectiveColorScheme, setColorScheme]);

  const isDark = effectiveColorScheme === 'dark';

  const dynamicStyles = useMemo(() => {
    return buildDesignVars(themeId, isDark);
  }, [themeId, isDark]);

  return (
    <View
      style={[
        dynamicStyles,
        { flex: 1, height: '100%', width: '100%', backgroundColor: getBgBaseHex(isDark) },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}

export function useEffectiveColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const colorMode = useSettingsStore((state) => state.colorMode);

  if (colorMode === 'system') {
    return systemColorScheme ?? 'light';
  }
  return colorMode;
}
