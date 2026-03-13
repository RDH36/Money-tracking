import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { QuizOptionCard } from '@/components/onboarding/QuizOptionCard';
import { useOnboardingQuiz, type GoalAnswer } from '@/contexts/OnboardingQuizContext';

const OPTIONS: { key: GoalAnswer; emoji: string }[] = [
  { key: 'less_stress', emoji: '😌' },
  { key: 'reach_goals', emoji: '🎯' },
  { key: 'feel_free', emoji: '🕊️' },
  { key: 'enjoy_life', emoji: '🌟' },
];

export default function QuizQ3Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { goal, setGoal } = useOnboardingQuiz();
  const [selected, setSelected] = useState<GoalAnswer | null>(goal);
  const posthog = usePostHog();

  const handleSelect = (key: GoalAnswer) => {
    setSelected(key);
    setGoal(key);
    posthog.capture('onboarding_quiz_answered', { question: 3, answer: key });
    setTimeout(() => router.replace('/onboarding/empathy'), 300);
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <ProgressBar step={3} totalSteps={9} />

        <VStack space="md" className="mb-8">
          <Text className="text-typography-500">{t('quiz.questionLabel')} 3/3</Text>
          <Heading size="xl" className="text-typography-900">
            {t('quiz.q3Title')}
          </Heading>
          <Text className="text-typography-600">
            {t('quiz.q3Subtitle')}
          </Text>
        </VStack>

        <VStack space="md" className="flex-1">
          {OPTIONS.map((option, index) => (
            <QuizOptionCard
              key={option.key}
              label={t(`quiz.q3_${option.key}`)}
              emoji={option.emoji}
              isSelected={selected === option.key}
              onPress={() => handleSelect(option.key)}
              index={index}
            />
          ))}
        </VStack>
      </Box>
    </View>
  );
}
