import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { SurveyError } from '@/lib/importFeedback';
import { SurveyTextField } from './SurveyTextField';

/** Seul lien externe de ce parcours : le règlement du tirage au sort. */
export const DRAW_RULES_URL = 'https://www.mitsitsy.app/tirage';

interface SurveyDrawStepProps {
  email: string;
  onEmailChange: (v: string) => void;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  /** Le message s'affiche dans le pied de feuille ; ici, seul le champ en cause est marqué. */
  error: SurveyError | 'save' | null;
}

/**
 * Dernière étape : participation FACULTATIVE au tirage. Le champ e-mail est en
 * haut (visible au-dessus du clavier) ; la case de consentement n'est jamais
 * cochée d'avance.
 */
export function SurveyDrawStep({ email, onEmailChange, consent, onConsentChange, error }: SurveyDrawStepProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const consentBad = error === 'consentMissing';

  return (
    <View style={{ gap: 14 }}>
      <SurveyTextField
        testID="import-survey-email"
        label={t('betaTester.draw.emailLabel')}
        placeholder={t('betaTester.draw.emailPlaceholder')}
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={254}
        invalid={error === 'emailInvalid' || error === 'emailMissing'}
      />

      <Pressable
        testID="import-survey-consent"
        onPress={() => onConsentChange(!consent)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        accessibilityLabel={t('betaTester.draw.consent')}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 }}
      >
        <View
          style={{
            width: 22, height: 22, borderRadius: 6, marginTop: 1,
            borderWidth: 1.5, borderColor: consent ? v2.brand : consentBad ? v2.bad : v2.hairlineStrong,
            backgroundColor: consent ? v2.brand : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {consent ? <Ionicons name="checkmark" size={14} color={v2.inkOnDark} /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, lineHeight: 18, color: v2.ink }}>
          {t('betaTester.draw.consent')}
        </Text>
      </Pressable>

      <View style={{ borderRadius: 12, padding: 12, backgroundColor: v2.bgRaised, gap: 8 }}>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 12, lineHeight: 18, color: v2.inkMuted }}>
          {t('betaTester.draw.info')}
        </Text>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 12, lineHeight: 18, color: v2.inkMuted }}>
          {t('betaTester.draw.optional')}
        </Text>
        <Pressable
          onPress={() => { Linking.openURL(DRAW_RULES_URL).catch(() => {}); }}
          accessibilityRole="link"
          hitSlop={8}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.brand, textDecorationLine: 'underline' }}>
            {t('betaTester.draw.rules')}
          </Text>
          <Ionicons name="open-outline" size={12} color={v2.brand} />
        </Pressable>
      </View>
    </View>
  );
}
