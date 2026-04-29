import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { QuizScreenV2 } from '@/components/onboarding/v2';
import {
  useOnboardingQuiz,
  type GoalAnswer,
} from '@/contexts/OnboardingQuizContext';

const KEYS: { key: GoalAnswer; emoji: string }[] = [
  { key: 'less_stress', emoji: '😌' },
  { key: 'reach_goals', emoji: '🎯' },
  { key: 'feel_free', emoji: '🕊️' },
  { key: 'enjoy_life', emoji: '🌟' },
];

export default function QuizQ3Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { goal, setGoal } = useOnboardingQuiz();
  const [selected, setSelected] = useState<GoalAnswer | null>(goal);
  const posthog = usePostHog();

  const handleSelect = (key: string) => {
    const k = key as GoalAnswer;
    setSelected(k);
    setGoal(k);
    posthog.capture('onboarding_quiz_answered', { question: 3, answer: k });
    setTimeout(() => router.replace('/onboarding/empathy'), 300);
  };

  return (
    <QuizScreenV2
      step={4}
      questionLabel={`${t('quiz.questionLabel')} 3 / 3`}
      title={t('quiz.q3Title')}
      bubbleSpeech={t('quiz.q3Subtitle')}
      bubbleImage={require('@/assets/images/bubule-smile.png')}
      options={KEYS.map((o) => ({
        key: o.key,
        emoji: o.emoji,
        label: t(`quiz.q3_${o.key}`),
      }))}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
