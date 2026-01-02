import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useOnboardingStatus } from '@/hooks';

export default function IndexRedirect() {
  const { isLoading, isCompleted } = useOnboardingStatus();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isCompleted) {
    return <Redirect href="/add" />;
  }

  return <Redirect href="/onboarding" />;
}
