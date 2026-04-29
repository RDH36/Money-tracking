import { useMemo, type ReactNode } from 'react';
import { ThemeContext, useTheme } from '@/contexts/ThemeContext';
import { ONBOARDING_ACCENT } from '@/constants/colors';

/**
 * Forces the brand accent (rose) for the entire onboarding flow,
 * independently of the user's selected theme. The override re-provides
 * ThemeContext deeper in the tree, so any `useTheme()` / `useV2()` call
 * inside onboarding screens reads the rose primary.
 */
export function OnboardingThemeOverride({ children }: { children: ReactNode }) {
  const parent = useTheme();
  const value = useMemo(
    () => ({
      ...parent,
      theme: {
        ...parent.theme,
        colors: {
          ...parent.theme.colors,
          primary: ONBOARDING_ACCENT,
          primaryLight: ONBOARDING_ACCENT + '14',
        },
      },
    }),
    [parent]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
