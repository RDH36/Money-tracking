import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { QuizScreenV2 } from '@/components/onboarding/v2';
import {
  useOnboardingQuiz,
  type DurationAnswer,
} from '@/contexts/OnboardingQuizContext';

const KEYS: { key: DurationAnswer; emoji: string }[] = [
  { key: 'few_months', emoji: '📅' },
  { key: 'more_than_year', emoji: '📆' },
  { key: 'always', emoji: '♾️' },
];

export default function QuizQ2Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { duration, setDuration } = useOnboardingQuiz();
  const [selected, setSelected] = useState<DurationAnswer | null>(duration);
  const posthog = usePostHog();

  const handleSelect = (key: string) => {
    const k = key as DurationAnswer;
    setSelected(k);
    setDuration(k);
    posthog.capture('onboarding_quiz_answered', { question: 2, answer: k });
    setTimeout(() => router.push('/onboarding/quiz-3'), 300);
  };

  return (
    <QuizScreenV2
      step={3}
      questionLabel={`${t('quiz.questionLabel')} 2 / 3`}
      title={t('quiz.q2Title')}
      bubbleSpeech={t('quiz.q2Subtitle')}
      bubbleImage={require('@/assets/images/bubule-time.png')}
      options={KEYS.map((o) => ({
        key: o.key,
        emoji: o.emoji,
        label: t(`quiz.q2_${o.key}`),
      }))}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
