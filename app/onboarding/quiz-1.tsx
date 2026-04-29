import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { QuizScreenV2 } from '@/components/onboarding/v2';
import { useV2 } from '@/constants/designTokensV2';
import {
  useOnboardingQuiz,
  type FrustrationAnswer,
} from '@/contexts/OnboardingQuizContext';

const KEYS: { key: FrustrationAnswer; emoji: string }[] = [
  { key: 'dont_know_where', emoji: '🤷' },
  { key: 'hard_to_save', emoji: '💸' },
  { key: 'stress', emoji: '😰' },
  { key: 'plan_better', emoji: '📋' },
];

export default function QuizQ1Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const v2 = useV2();
  const { frustration, setFrustration } = useOnboardingQuiz();
  const [selected, setSelected] = useState<FrustrationAnswer | null>(frustration);
  const posthog = usePostHog();

  const handleSelect = (key: string) => {
    const k = key as FrustrationAnswer;
    setSelected(k);
    setFrustration(k);
    posthog.capture('onboarding_quiz_answered', { question: 1, answer: k });
    setTimeout(() => router.push('/onboarding/quiz-2'), 300);
  };

  return (
    <QuizScreenV2
      step={2}
      questionLabel={`${t('quiz.questionLabel')} 1 / 3`}
      title={t('quiz.q1Title')}
      bubbleSpeech={t('quiz.q1Subtitle')}
      bubbleImage={require('@/assets/images/bubble-frustration.png')}
      options={KEYS.map((o) => ({
        key: o.key,
        emoji: o.emoji,
        label: t(`quiz.q1_${o.key}`),
      }))}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
