import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { SurveyChoice } from '@/components/cloud-backup-survey/SurveyChoice';
import { FEELINGS, IMPORT_SURVEY_KEY, type Feeling, type SurveyError } from '@/lib/importFeedback';
import { useImportFeedback, type SubmitOutcome } from '@/hooks/importFeedback/useImportFeedback';
import { SurveyDrawStep } from './SurveyDrawStep';
import { SurveyTextField } from './SurveyTextField';

const FEELING_ICONS: Record<Feeling, string> = {
  great: 'happy-outline', ok: 'thumbs-up-outline', bad: 'sad-outline',
};
const STEPS = 3;
const MAX_COMMENT = 300;

interface ImportSurveySheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** D'où vient l'ouverture : quota atteint (auto) ou carte « Testeur bêta ». */
  trigger: 'auto' | 'card';
}

/** Sondage de l'import (clé `import_g1`) : ressenti, avis libre, tirage facultatif. */
export function ImportSurveySheet({ isOpen, onClose, trigger }: ImportSurveySheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { markLater, submit } = useImportFeedback();
  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<SurveyError | 'save' | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Extract<SubmitOutcome, { ok: true }> | null>(null);

  // À chaque ouverture : formulaire vierge (case de consentement décochée).
  useEffect(() => {
    if (!isOpen) return;
    setStep(0); setFeeling(null); setComment(''); setEmail(''); setConsent(false);
    setError(null); setBusy(false); setDone(null);
    posthog.capture(`${IMPORT_SURVEY_KEY}_survey_shown`, { trigger });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fermer sans avoir envoyé = « Plus tard ».
  const handleClose = () => {
    if (busy) return;
    if (!done) markLater();
    onClose();
  };

  const handleNext = async () => {
    if (busy || !feeling) return;
    if (step < STEPS - 1) { setStep((s) => s + 1); return; }
    setBusy(true);
    setError(null);
    const outcome = await submit(
      { feeling, comment, email, consent },
      {
        question: t('betaTester.survey.q1'),
        answer: t(`betaTester.feelings.${feeling}`),
        consentText: t('betaTester.draw.consent'),
      },
    );
    setBusy(false);
    if (outcome.ok) setDone(outcome);
    else setError(outcome.error);
  };

  const handleBack = () => {
    if (step === 0) { handleClose(); return; }
    setError(null);
    setStep((s) => s - 1);
  };

  const outline = {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: v2.hairlineStrong,
    alignItems: 'center' as const, justifyContent: 'center' as const, opacity: busy ? 0.5 : 1,
  };
  const solid = {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: v2.bgInk,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  };
  const nextDisabled = !feeling || busy;

  // Sous la case de consentement : reste visible au-dessus du clavier.
  const errorBlock = error ? (
    <View
      style={{
        padding: 12, borderRadius: 12, backgroundColor: v2.badSoft,
        flexDirection: 'row', alignItems: 'center', gap: 8,
      }}
    >
      <Ionicons name="alert-circle" size={18} color={v2.bad} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.bad }}>
        {t(`betaTester.errors.${error}`)}
      </Text>
    </View>
  ) : null;

  const footer = done ? (
    <Pressable onPress={handleClose} accessibilityRole="button" style={solid}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
        {t('common.close')}
      </Text>
    </Pressable>
  ) : (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable onPress={handleBack} disabled={busy} accessibilityRole="button" style={outline}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
          {step === 0 ? t('betaTester.survey.later') : t('cloudSurvey.back')}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleNext} disabled={nextDisabled} accessibilityRole="button"
        style={{ ...solid, opacity: nextDisabled ? 0.5 : 1 }}
      >
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
          {busy ? t('feedback.sending') : step === STEPS - 1 ? t('feedback.send') : t('cloudSurvey.next')}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('betaTester.survey.title')} footer={footer}>
      {done ? (
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
          <Ionicons name="checkmark-circle" size={42} color={v2.good} />
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 17, fontWeight: '700', color: v2.ink, textAlign: 'center' }}>
            {t('betaTester.success.title')}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, lineHeight: 19, color: v2.inkMuted, textAlign: 'center' }}>
            {t(done.sent ? 'betaTester.success.sent' : 'betaTester.success.queued')}
            {done.draw ? `\n${t('betaTester.success.draw')}` : ''}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View
                key={i}
                style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? v2.brand : v2.hairline }}
              />
            ))}
          </View>
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 18, fontWeight: '700', color: v2.ink, lineHeight: 24 }}>
            {t(`betaTester.survey.q${step + 1}`)}
          </Text>

          {step === 0 ? (
            <View style={{ gap: 8 }}>
              {FEELINGS.map((f) => (
                <SurveyChoice
                  key={f}
                  label={t(`betaTester.feelings.${f}`)}
                  sublabel={t(`betaTester.feelings.${f}Sub`)}
                  icon={FEELING_ICONS[f]}
                  selected={feeling === f}
                  onPress={() => setFeeling(f)}
                />
              ))}
            </View>
          ) : step === 1 ? (
            <SurveyTextField
              testID="import-survey-comment"
              label={t('betaTester.survey.commentLabel')}
              placeholder={t('betaTester.survey.commentPlaceholder')}
              value={comment}
              onChangeText={setComment}
              maxLength={MAX_COMMENT}
              multiline
            />
          ) : (
            <SurveyDrawStep
              email={email}
              onEmailChange={(v) => { setEmail(v); setError(null); }}
              consent={consent}
              onConsentChange={(v) => { setConsent(v); setError(null); }}
              error={error}
              errorSlot={errorBlock}
            />
          )}

        </View>
      )}
    </BottomSheet>
  );
}
