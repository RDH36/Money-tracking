import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr, type V2Tokens } from '@/constants/designTokensV2';
import { useSQLiteContext } from '@/lib/database';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useCycleSettings } from '@/hooks/useCycleSettings';
import { detectPayday } from '@/lib/analysis/payday';

type Detection = Awaited<ReturnType<typeof detectPayday>>;

/**
 * Carte de confirmation du cycle, sous le hero. Utilisateurs existants
 * d'abord : on propose ce que l'historique suggère, un tap suffit.
 * Style DOUX (surface neutre) : une proposition, pas une alerte.
 * Ne rend rien si le cycle est déjà confirmé ou si rien n'est détecté.
 */
export function CycleConfirmCard() {
  const v2 = useV2();
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const currency = useCurrencyCode();
  const { isConfirmed, save } = useCycleSettings();
  const [detected, setDetected] = useState<Detection | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (isConfirmed) return;
    let cancelled = false;
    detectPayday(db)
      .then((d) => { if (!cancelled) setDetected(d); })
      .catch(() => { /* détection silencieuse : la carte reste absente */ });
    return () => { cancelled = true; };
  }, [db, isConfirmed]);

  if (isConfirmed || answered || !detected) return null;

  const isPayday = detected.mode === 'payday' && detected.confidence >= 0.5 && detected.payDay !== null;
  const isIrregular = detected.mode === 'irregular';
  if (!isPayday && !isIrregular) return null;

  const answer = async (fn: () => Promise<void>) => {
    setAnswered(true);
    try { await fn(); } catch { setAnswered(false); }
  };
  const confirmPayday = () =>
    answer(() => save({ mode: 'payday', payDay: detected.payDay, expectedIncome: detected.expectedIncome, source: 'detected' }));
  const confirmIrregular = () =>
    answer(() => save({ mode: 'irregular', expectedIncome: detected.expectedIncome, source: 'detected' }));
  const openEditor = () => router.push('/settings/cycle' as any);

  return (
    <View
      style={{
        marginTop: 16, backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 18, padding: 16, gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40, height: 40, borderRadius: 12, backgroundColor: v2.brandSoft,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, letterSpacing: 0.3 }}>
            {t(isPayday ? 'cycle.confirm.title' : 'cycle.confirm.irregularTitle')}
          </Text>
          <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 15, color: v2.ink, letterSpacing: -0.2, marginTop: 2 }}>
            {isPayday
              ? t('cycle.confirm.paydayLine', { day: detected.payDay })
              : t('cycle.confirm.irregularLine')}
          </Text>
          {isPayday && detected.expectedIncome ? (
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {t('cycle.confirm.amountLine', { amount: formatMoneyFr(detected.expectedIncome), currency })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <ChipButton v2={v2} primary label={t('cycle.confirm.yes')} onPress={isPayday ? confirmPayday : confirmIrregular} />
        {isPayday ? (
          <>
            <ChipButton v2={v2} label={t('cycle.confirm.edit')} onPress={openEditor} />
            <ChipButton v2={v2} label={t('cycle.confirm.irregular')} onPress={confirmIrregular} />
          </>
        ) : (
          <ChipButton v2={v2} label={t('cycle.confirm.hasPayday')} onPress={openEditor} />
        )}
      </View>
    </View>
  );
}

function ChipButton({ v2, label, onPress, primary = false }: { v2: V2Tokens; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999,
        backgroundColor: primary ? v2.bgInk : 'transparent',
        borderWidth: 1, borderColor: primary ? v2.bgInk : v2.hairlineStrong,
      }}
    >
      <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: primary ? v2.inkOnDark : v2.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
