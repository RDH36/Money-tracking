import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { useTheme } from '@/contexts';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <VStack className="flex-1 justify-center" space="xl">
          <Center>
            <Text className="text-6xl mb-4">💰</Text>
            <Heading size="2xl" className="text-center text-typography-900">
              Mitsitsy
            </Heading>
            <Text className="text-center text-typography-600 mt-2">
              Gérez vos finances simplement
            </Text>
          </Center>

          <VStack space="md" className="mt-8">
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ Saisie rapide des dépenses et revenus
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ Dashboard avec graphiques par catégorie
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ Rappels pour ne rien oublier
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ 100% hors ligne, vos données restent privées
              </Text>
            </Box>
          </VStack>
        </VStack>

        <Button
          size="xl"
          className="w-full"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={() => router.push('/onboarding/currency' as const)}
        >
          <ButtonText className="text-white">Commencer</ButtonText>
        </Button>
      </Box>
    </View>
  );
}
