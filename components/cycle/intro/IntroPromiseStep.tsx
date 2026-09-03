import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { IntroPrimaryButton, IntroTextLink } from './IntroButtons';

interface IntroPromiseStepProps {
  onContinue: () => void;
  onLater: () => void;
  /** Relecture depuis « Ton mois » : pastille « À propos », un seul bouton « Compris ». */
  replay?: boolean;
}

type IconName = keyof typeof Ionicons.glyphMap;

/** Les trois promesses de la maquette : icône dans un carré teinté, titre, une ligne. */
function promises(v2: V2Tokens): { icon: IconName; bg: string; color: string; titleKey: string; bodyKey: string }[] {
  return [
    { icon: 'checkmark', bg: v2.goodSoft, color: v2.good, titleKey: 'intro.mois.p1Title', bodyKey: 'intro.mois.p1Body' },
    { icon: 'trending-up-outline', bg: v2.warnSoft, color: v2.warn, titleKey: 'intro.mois.p2Title', bodyKey: 'intro.mois.p2Body' },
    { icon: 'flash-outline', bg: v2.brandTint, color: v2.brand, titleKey: 'intro.mois.p3Title', bodyKey: 'intro.mois.p3Body' },
  ];
}

/**
 * Étape 1/2 de l'introduction « Ton mois » (maquette Intro) : pastille
 * « Nouveau », titre, trois cartes-promesses, ligne de confiance, puis
 * « Continuer » / « Plus tard ». Le parent gère la navigation.
 */
export function IntroPromiseStep({ onContinue, onLater, replay = false }: IntroPromiseStepProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, gap: 22 }}>
      <View style={{ gap: 12 }}>
        <View
          style={{
            alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10,
            borderRadius: 999, backgroundColor: v2.brandTint,
          }}
        >
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600',
              letterSpacing: 1, textTransform: 'uppercase', color: v2.brand,
            }}
          >
            {t(replay ? 'intro.mois.about' : 'intro.mois.new')}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '800', fontSize: 30, lineHeight: 36,
            letterSpacing: -1, color: v2.ink,
          }}
        >
          {t('intro.mois.title')}
        </Text>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 15, lineHeight: 22, color: v2.inkMuted }}>
          {t('intro.mois.subtitle')}
        </Text>
      </View>

      <View style={{ backgroundColor: v2.brandTint, borderRadius: 14, padding: 12 }}>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 19, color: v2.ink }}>
          {t('intro.mois.why')}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {promises(v2).map((p) => (
          <View
            key={p.titleKey}
            style={{
              flexDirection: 'row', gap: 14, alignItems: 'flex-start',
              backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
              borderRadius: 18, padding: 16,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 12, backgroundColor: p.bg,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name={p.icon} size={20} color={p.color} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 15, color: v2.ink }}>
                {t(p.titleKey)}
              </Text>
              <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 18, color: v2.inkMuted }}>
                {t(p.bodyKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 14, gap: 10 }}>
        <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 14, color: v2.ink }}>
          {t('intro.mois.vsTitle')}
        </Text>
        {(['vsReports', 'vsMonth'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons
              name={k === 'vsReports' ? 'bar-chart-outline' : 'chatbubble-ellipses-outline'}
              size={16}
              color={k === 'vsReports' ? v2.inkMuted : v2.brand}
              style={{ marginTop: 1 }}
            />
            <Text style={{ flex: 1, fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 18, color: v2.inkMuted }}>
              <Text style={{ fontFamily: v2.fontUI, fontWeight: '700', color: v2.ink }}>{t(`intro.mois.${k}Name`)}</Text>
              {' — '}
              {t(`intro.mois.${k}`)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="lock-closed-outline" size={14} color={v2.inkMuted} />
        <Text style={{ flex: 1, fontFamily: v2.fontUIRegular, fontSize: 12, lineHeight: 16, color: v2.inkMuted }}>
          {t('intro.mois.trust')}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 10 }}>
        <IntroPrimaryButton label={t(replay ? 'intro.mois.gotIt' : 'intro.mois.continue')} onPress={onContinue} />
        {replay ? null : <IntroTextLink label={t('intro.mois.later')} onPress={onLater} />}
      </View>
    </View>
  );
}
