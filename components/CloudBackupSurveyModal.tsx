import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { buildSurveySteps } from '@/components/cloud-backup-survey/options';
import { SurveyChoice } from '@/components/cloud-backup-survey/SurveyChoice';
import { useSurveySubmit } from '@/components/cloud-backup-survey/useSurveySubmit';

interface CloudBackupSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswered: () => void;
}

export function CloudBackupSurveyModal({ isOpen, onClose, onAnswered }: CloudBackupSurveyModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const currency = useCurrency();
  const { submit, isSubmitting, error, setError } = useSurveySubmit('cloud_backup');

  const steps = useMemo(() => buildSurveySteps(currency.code, t), [currency.code, t]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Si l'utilisateur ne veut pas la feature, on ne demande pas prix/mode.
  const totalSteps = answers.wants === 'no' ? 1 : steps.length;
  const current = steps[step];
  const selected = answers[current.key];
  const isLast = step === totalSteps - 1;

  const reset = () => {
    setStep(0); setAnswers({}); setSuccess(false); setError(null);
  };
  const handleClose = () => {
    if (isSubmitting) return;
    reset(); onClose();
  };

  const select = (value: string) => {
    setError(null);
    setAnswers((a) => ({ ...a, [current.key]: value }));
  };

  const handleNext = async () => {
    if (!selected) return;
    if (!isLast) { setStep((s) => s + 1); return; }
    const ok = await submit({
      wants_feature: answers.wants,
      price_monthly: answers.priceMonthly ?? null,
      price_yearly: answers.priceYearly ?? null,
      sync_mode: answers.syncMode ?? null,
    }, currency.code);
    if (ok) {
      setSuccess(true);
      // Marqué "répondu" seulement après l'écran de remerciement, sinon la
      // bannière (et donc la modale) se démonterait avant qu'il s'affiche.
      setTimeout(() => { onAnswered(); reset(); onClose(); }, 1800);
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
              onPress={handleNext} disabled={!selected || isSubmitting}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: v2.bgInk,
                alignItems: 'center', justifyContent: 'center',
                opacity: !selected || isSubmitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
                {isSubmitting ? t('feedback.sending') : isLast ? t('feedback.send') : t('cloudSurvey.next')}
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
            {current.question}
          </Text>

          <View style={{ gap: 8 }}>
            {current.options.map((opt) => (
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
