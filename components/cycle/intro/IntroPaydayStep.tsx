import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import type { PaydayDetection } from '@/lib/analysis/payday';
import { IntroPrimaryButton, IntroSecondaryButton, IntroButtonRow } from './IntroButtons';

export interface IntroPaydayStepProps {
  /** `null` tant que la détection tourne. */
  detected: PaydayDetection | null;
  currency: string;
  busy: boolean;
  onConfirmPayday: () => void;
  onChangeDay: () => void;
  onIrregular: () => void;
  onSeeAnyway: () => void;
}

/**
 * Étape 2/2 (maquette IntroPaye) : « Une chose à vérifier : ta paye ».
 * Trois variantes selon la détection — jour de paye repéré, revenus
 * irréguliers, rien de repéré. Le parent gère sauvegarde et navigation.
 */
export function IntroPaydayStep(props: IntroPaydayStepProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, gap: 28 }}>
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600',
            letterSpacing: 1, textTransform: 'uppercase', color: v2.inkMuted,
          }}
        >
          {t('intro.mois.step2')}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '800', fontSize: 30, lineHeight: 36,
            letterSpacing: -1, color: v2.ink,
          }}
        >
          {t('intro.mois.payTitle')}
        </Text>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 15, lineHeight: 22, color: v2.inkMuted }}>
          {t('intro.mois.payIntro')}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
          borderRadius: 22, padding: 22, gap: 18,
        }}
      >
        {props.detected === null ? (
          <ActivityIndicator color={v2.brand} style={{ paddingVertical: 24 }} />
        ) : (
          <DetectionBody {...props} detected={props.detected} />
        )}
      </View>

      <View style={{ flex: 1 }} />
      <Text style={{ textAlign: 'center', fontFamily: v2.fontUIRegular, fontSize: 12, color: v2.inkMuted }}>
        {t('intro.mois.editable')}
      </Text>
    </View>
  );
}

function DetectionBody({
  detected, currency, busy, onConfirmPayday, onChangeDay, onIrregular, onSeeAnyway,
}: IntroPaydayStepProps & { detected: PaydayDetection }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const isPayday = detected.mode === 'payday' && detected.payDay !== null;
  const isIrregular = detected.mode === 'irregular';

  const title = isPayday
    ? t('intro.mois.paidAround', { day: detected.payDay })
    : t(isIrregular ? 'intro.mois.irregularTitle' : 'intro.mois.notFoundTitle');
  const sub = isPayday && detected.expectedIncome
    ? t('intro.mois.aboutPerMonth', { amount: formatMoneyFr(detected.expectedIncome), currency })
    : null;
  const note = isPayday
    ? t('intro.mois.spotted', { count: detected.occurrences })
    : t(isIrregular ? 'intro.mois.irregularBody' : 'intro.mois.notFoundBody');

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View
          style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: v2.brandTint,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={isPayday ? 'calendar-outline' : 'help-circle-outline'} size={22} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '800', letterSpacing: -0.5, color: v2.ink,
              fontSize: isPayday ? 22 : 18, lineHeight: isPayday ? 28 : 24,
            }}
          >
            {title}
          </Text>
          {sub ? (
            <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 14, color: v2.inkMuted, fontVariant: ['tabular-nums'] }}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: v2.hairline }} />

      <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 18, color: v2.inkMuted }}>
        {note}
      </Text>

      <View style={{ gap: 10 }}>
        {isPayday ? (
          <>
            <IntroPrimaryButton tone="brand" label={t('intro.mois.confirm')} onPress={onConfirmPayday} disabled={busy} />
            <IntroButtonRow>
              <IntroSecondaryButton label={t('intro.mois.changeDay')} onPress={onChangeDay} disabled={busy} />
              <IntroSecondaryButton label={t('intro.mois.irregular')} onPress={onIrregular} disabled={busy} />
            </IntroButtonRow>
          </>
        ) : isIrregular ? (
          <>
            <IntroPrimaryButton tone="brand" label={t('intro.mois.confirm')} onPress={onIrregular} disabled={busy} />
            <IntroButtonRow>
              <IntroSecondaryButton label={t('intro.mois.hasPayday')} onPress={onChangeDay} disabled={busy} />
            </IntroButtonRow>
          </>
        ) : (
          <>
            <IntroPrimaryButton tone="brand" label={t('intro.mois.setPayday')} onPress={onChangeDay} disabled={busy} />
            <IntroButtonRow>
              <IntroSecondaryButton label={t('intro.mois.seeAnyway')} onPress={onSeeAnyway} disabled={busy} />
            </IntroButtonRow>
          </>
        )}
      </View>
    </>
  );
}
