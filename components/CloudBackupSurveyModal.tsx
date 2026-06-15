import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { buildSurveySteps } from '@/components/cloud-backup-survey/options';
import { SurveyChoice } from '@/components/cloud-backup-survey/SurveyChoice';
import { SurveyContactStep } from '@/components/cloud-backup-survey/SurveyContactStep';
import { useSurveySubmit } from '@/components/cloud-backup-survey/useSurveySubmit';

interface CloudBackupSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswered: (answers: Record<string, string>) => void;
  /** Réponses précédentes pour pré-remplir (édition depuis les réglages). */
  initialAnswers?: Record<string, string> | null;
}

export function CloudBackupSurveyModal({ isOpen, onClose, onAnswered, initialAnswers }: CloudBackupSurveyModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const currency = useCurrency();
  const { submit, isSubmitting, error, setError } = useSurveySubmit('cloud_backup');

  const steps = useMemo(() => buildSurveySteps(currency.code, t), [currency.code, t]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  // À chaque ouverture : on (ré)initialise, en pré-remplissant si on édite.
  useEffect(() => {
    if (!isOpen) return;
    const init = initialAnswers ?? {};
    const { email: e, comment: c, ...choices } = init;
    setAnswers(choices);
    setEmail(e ?? '');
    setComment(c ?? '');
    setStep(0); setSuccess(false); setError(null);
  }, [isOpen]);

  // Si l'utilisateur ne veut pas la feature, on saute prix/mode (mais on garde le contact).
  const choiceSteps = answers.wants === 'no' ? steps.slice(0, 1) : steps;
  const totalSteps = choiceSteps.length + 1; // +1 = étape contact (email + opinion)
  const isContactStep = step === totalSteps - 1;
  const current = isContactStep ? null : choiceSteps[step];
  const selected = current ? answers[current.key] : undefined;

  const reset = () => {
    setStep(0); setAnswers({}); setEmail(''); setComment(''); setSuccess(false); setError(null);
  };
  const handleClose = () => {
    if (isSubmitting) return;
    reset(); onClose();
  };

  const select = (value: string) => {
    if (!current) return;
    setError(null);
    setAnswers((a) => ({ ...a, [current.key]: value }));
  };

  const handleNext = async () => {
    if (current && !selected) return;
    if (!isContactStep) { setStep((s) => s + 1); return; }
    // Version LISIBLE (question + libellé de réponse, langue du répondant) pour le BO.
    const items = choiceSteps.map((s) => {
      const value = answers[s.key] ?? null;
      const opt = s.options.find((o) => o.value === value);
      return { key: s.key, question: s.question, value, answer: opt?.label ?? null };
    });
    const ok = await submit({
      response: { items, comment: comment.trim() || null },
      email: email.trim() || null,
      currency: currency.code,
      tracking: {
        wants_feature: answers.wants,
        price_monthly: answers.priceMonthly ?? null,
        price_yearly: answers.priceYearly ?? null,
        sync_mode: answers.syncMode ?? null,
      },
    });
    if (ok) {
      setSuccess(true);
      const saved = { ...answers, email: email.trim(), comment: comment.trim() };
      setTimeout(() => { onAnswered(saved); reset(); onClose(); }, 1800);
    }
  };

  const handleBack = () => {
    if (step === 0) { handleClose(); return; }
    setError(null);
    setStep((s) => s - 1);
  };

  const errorText = error === 'noInternet' ? t('errors.noInternet')
    : error === 'submit' ? t('cloudSurvey.errorSubmit') : null;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('cloudSurvey.modalTitle')}
      footer={
        success ? null : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={handleBack} disabled={isSubmitting}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12,
                borderWidth: 1, borderColor: v2.hairlineStrong,
                alignItems: 'center', justifyContent: 'center', opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
                {step === 0 ? t('common.cancel') : t('cloudSurvey.back')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNext} disabled={(!!current && !selected) || isSubmitting}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: v2.bgInk,
                alignItems: 'center', justifyContent: 'center',
                opacity: (!!current && !selected) || isSubmitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
                {isSubmitting ? t('feedback.sending') : isContactStep ? t('feedback.send') : t('cloudSurvey.next')}
              </Text>
            </Pressable>
          </View>
        )
      }
    >
      {success ? (
        <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <Ionicons name="checkmark-circle" size={42} color={v2.good} />
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 17, fontWeight: '700', color: v2.ink }}>
            {t('cloudSurvey.successTitle')}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, textAlign: 'center' }}>
            {t('cloudSurvey.successSub')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                backgroundColor: i <= step ? v2.brand : v2.hairline,
              }} />
            ))}
          </View>

          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 18, fontWeight: '700', color: v2.ink, lineHeight: 24 }}>
            {isContactStep ? t('cloudSurvey.q5') : current!.question}
          </Text>

          {isContactStep ? (
            <SurveyContactStep
              email={email} onEmailChange={setEmail}
              comment={comment} onCommentChange={setComment}
            />
          ) : (
            <View style={{ gap: 8 }}>
              {current!.options.map((opt) => (
                <SurveyChoice
                  key={opt.value}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  icon={opt.icon}
                  selected={selected === opt.value}
                  onPress={() => select(opt.value)}
                />
              ))}
            </View>
          )}

          {errorText ? (
            <View style={{
              padding: 12, borderRadius: 12, backgroundColor: v2.badSoft,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Ionicons name="alert-circle" size={18} color={v2.bad} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.bad }}>
                {errorText}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}
