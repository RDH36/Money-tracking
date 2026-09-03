import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useV2 } from '@/constants/designTokensV2';
import { useSQLiteContext } from '@/lib/database';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useIntroMois } from '@/hooks/useIntroMois';
import { useCycleSettings } from '@/hooks/useCycleSettings';
import { detectPayday, type PaydayDetection } from '@/lib/analysis/payday';
import { IntroPromiseStep, IntroPaydayStep } from '@/components/cycle/intro';

/**
 * Introduction « Ton mois » (Phase 8), deux étapes en état local :
 * 1. les trois promesses ; 2. vérification de la paye détectée.
 * L'étape 2 est sautée si le cycle est déjà confirmé. Chaque sortie
 * marque l'intro comme parcourue (`markSeen`) sauf « Plus tard ».
 */
export default function IntroMoisScreen() {
  const v2 = useV2();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // `replay=1` : relecture depuis l'écran « Ton mois » — étape 1 seule, retour simple.
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const isReplay = replay === '1';
  const db = useSQLiteContext();
  const currency = useCurrencyCode();
  const { markShown, markSeen } = useIntroMois();
  const { isConfirmed, save } = useCycleSettings();

  const [step, setStep] = useState<1 | 2>(1);
  const [detected, setDetected] = useState<PaydayDetection | null>(null);
  const [busy, setBusy] = useState(false);

  // Détection lancée dès le montage : le résultat est prêt quand on arrive à l'étape 2.
  useEffect(() => {
    if (isConfirmed || isReplay) return;
    let cancelled = false;
    detectPayday(db)
      .then((d) => { if (!cancelled) setDetected(d); })
      .catch(() => {
        if (!cancelled) {
          setDetected({ mode: 'calendar', payDay: null, expectedIncome: null, confidence: 0, occurrences: 0 });
        }
      });
    return () => { cancelled = true; };
  }, [db, isConfirmed, isReplay]);

  /** Termine l'intro puis remplace l'écran (retour → tableau de bord). */
  const finish = useCallback(
    async (href: '/analysis' | '/settings/cycle', persist?: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      try {
        if (persist) await persist();
        await markSeen();
        router.replace(href as any);
      } catch (err) {
        console.error('Error finishing intro:', err);
        setBusy(false);
      }
    },
    [busy, markSeen, router]
  );

  const handleLater = async () => {
    await markShown();
    router.back();
  };
  const handleContinue = () => {
    if (isReplay) router.back();
    else if (isConfirmed) finish('/analysis');
    else setStep(2);
  };
  const handleConfirmPayday = () =>
    finish('/analysis', () =>
      save({ mode: 'payday', payDay: detected?.payDay ?? null, expectedIncome: detected?.expectedIncome ?? null, source: 'detected' })
    );
  const handleIrregular = () =>
    finish('/analysis', () =>
      save({ mode: 'irregular', expectedIncome: detected?.expectedIncome ?? null, source: 'detected' })
    );

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase }}>
      <ScrollView
        contentContainerStyle={{
          // Maquette : 72 px en haut, 24 px sur les côtés, 32 px en bas.
          flexGrow: 1, paddingTop: Math.max(72, insets.top + 32), paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <IntroPromiseStep onContinue={handleContinue} onLater={handleLater} replay={isReplay} />
        ) : (
          <IntroPaydayStep
            detected={detected}
            currency={currency}
            busy={busy}
            onConfirmPayday={handleConfirmPayday}
            onChangeDay={() => finish('/settings/cycle')}
            onIrregular={handleIrregular}
            onSeeAnyway={() => finish('/analysis')}
          />
        )}
      </ScrollView>
    </View>
  );
}
