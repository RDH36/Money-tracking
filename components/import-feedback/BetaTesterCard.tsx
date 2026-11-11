import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { OCR_IMPORT_ENABLED } from '@/constants/app';
import { isOcrAvailable } from '@/modules/mitsitsy-ocr';
import { useOcrQuota } from '@/hooks/premium/useOcrQuota';
import { useImportFeedback } from '@/hooks/importFeedback/useImportFeedback';
import { betaCardState } from '@/lib/importFeedback';
import { ImportSurveySheet } from './ImportSurveySheet';

/**
 * Invitation « Testeur bêta » sous la carte d'import (écran d'ajout) :
 * progression des lectures du cycle, puis accès au sondage une fois le quota
 * atteint. Disparaît dès que l'avis est envoyé.
 */
export function BetaTesterCard() {
  const v2 = useV2();
  const { t } = useTranslation();
  const quota = useOcrQuota();
  const feedback = useImportFeedback();
  const [open, setOpen] = useState(false);

  if (!OCR_IMPORT_ENABLED || !isOcrAvailable) return null;

  const card = betaCardState({
    loaded: quota.loaded && feedback.loaded, unlimited: quota.unlimited,
    answered: feedback.answered, used: quota.used, limit: quota.limit,
  });
  // La feuille garde la même place dans l'arbre : après l'envoi la carte
  // disparaît, l'écran de remerciement reste lisible jusqu'à sa fermeture.
  const sheet = <ImportSurveySheet isOpen={open} onClose={() => setOpen(false)} trigger="card" />;
  if (!card) return <>{null}{sheet}</>;

  // Le lot du tirage ressort dans la phrase (gras, encre pleine), sans changer le texte.
  const sub = card.ready ? t('betaTester.card.readySub') : t('betaTester.card.sub', { limit: card.limit });
  const prize = t('betaTester.card.prize');
  const at = sub.indexOf(prize);

  return (
    <>
    <View
      testID="beta-tester-card"
      style={{
        marginTop: 10, backgroundColor: v2.brandSoft, borderRadius: 14, borderWidth: 1,
        borderColor: v2.brand + '33', paddingVertical: 12, paddingHorizontal: 12, gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 34, height: 34, borderRadius: 10, backgroundColor: v2.brandTint,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="flask-outline" size={17} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
              {t('betaTester.card.title')}
            </Text>
            <Text
              accessibilityLabel={t('betaTester.card.progressA11y', { used: card.progress, limit: card.limit })}
              style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.brand, fontVariant: ['tabular-nums'] }}
            >
              {t('betaTester.card.progress', { used: card.progress, limit: card.limit })}
            </Text>
          </View>
          <Text style={{ marginTop: 2, fontFamily: v2.fontUIRegular, fontSize: 11, lineHeight: 15, color: v2.inkMuted }}>
            {at < 0 ? sub : (
              <>
                {sub.slice(0, at)}
                <Text style={{ fontFamily: v2.fontUI, fontWeight: '700', color: v2.ink }}>{prize}</Text>
                {sub.slice(at + prize.length)}
              </>
            )}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: card.limit }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < card.progress ? v2.brand : v2.hairlineStrong }}
          />
        ))}
      </View>

      {card.ready ? (
        <Pressable
          testID="beta-tester-cta"
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={{
            minHeight: 44, borderRadius: 12, backgroundColor: v2.bgInk, paddingHorizontal: 12, paddingVertical: 10,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
            {t('betaTester.card.cta')}
          </Text>
        </Pressable>
      ) : null}
    </View>
    {sheet}
    </>
  );
}
