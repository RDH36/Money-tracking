import { Stack } from 'expo-router';
import { OnboardingQuizProvider } from '@/contexts/OnboardingQuizContext';
import { OnboardingThemeOverride } from '@/components/onboarding/OnboardingThemeOverride';

export default function OnboardingLayout() {
  return (
    <OnboardingThemeOverride>
      <OnboardingQuizProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: false,
          }}
        />
      </OnboardingQuizProvider>
    </OnboardingThemeOverride>
  );
}
