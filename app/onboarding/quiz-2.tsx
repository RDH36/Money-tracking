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
import { useOnboardingQuiz, type DurationAnswer } from '@/contexts/OnboardingQuizContext';

const OPTIONS: { key: DurationAnswer; emoji: string }[] = [
  { key: 'few_months', emoji: '📅' },
  { key: 'more_than_year', emoji: '📆' },
  { key: 'always', emoji: '♾️' },
];

export default function QuizQ2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { duration, setDuration } = useOnboardingQuiz();
  const [selected, setSelected] = useState<DurationAnswer | null>(duration);
  const posthog = usePostHog();

  const handleSelect = (key: DurationAnswer) => {
    setSelected(key);
    setDuration(key);
    posthog.capture('onboarding_quiz_answered', { question: 2, answer: key });
    setTimeout(() => router.push('/onboarding/quiz-3'), 300);
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <ProgressBar step={2} totalSteps={9} />

        <VStack space="md" className="mb-8">
          <Text className="text-typography-500">{t('quiz.questionLabel')} 2/3</Text>
          <Heading size="xl" className="text-typography-900">
            {t('quiz.q2Title')}
          </Heading>
          <Text className="text-typography-600">
            {t('quiz.q2Subtitle')}
          </Text>
        </VStack>

        <VStack space="md" className="flex-1">
          {OPTIONS.map((option, index) => (
            <QuizOptionCard
              key={option.key}
              label={t(`quiz.q2_${option.key}`)}
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
