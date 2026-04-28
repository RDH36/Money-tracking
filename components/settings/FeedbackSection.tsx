import { useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SectionLabel, SettingsCard, SettingsRow } from '@/components/settings/v2';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.rdh36.moneytracking';
const INSTAGRAM_URL = 'https://www.instagram.com/mitsitsy.app';
const HELP_URL = 'https://www.mitsitsy.app/help';
const ROADMAP_URL = 'https://www.mitsitsy.app/roadmap';

export function FeedbackSection() {
  const v2 = useV2();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          paddingVertical: 22,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 22,
            color: v2.ink, lineHeight: 28, letterSpacing: -0.4,
            fontStyle: 'italic',
          }}
        >
          “{t('feedbackV2.quoteAround1')}{' '}
          <Text style={{ backgroundColor: v2.brand + '30' }}>
            {t('feedbackV2.quoteHighlight')}
          </Text>{' '}
          {t('feedbackV2.quoteAround2')}”
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600',
            color: v2.inkSubtle, marginTop: 12,
          }}
        >
          {t('feedbackV2.quoteAuthor')}
        </Text>
      </View>

      <SectionLabel>{t('feedbackV2.opinionSection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="star"
          iconColor={v2.warn}
          label={t('feedbackV2.rateAppstore')}
          sublabel={t('feedbackV2.rateAppstoreSub')}
          onPress={() => Linking.openURL(PLAY_STORE_URL)}
        />
        <SettingsRow
          icon="mail-outline"
          iconColor={v2.brand}
          label={t('feedbackV2.contactTeam')}
          sublabel={t('feedbackV2.contactTeamSub')}
          onPress={() => setShowModal(true)}
        />
        <SettingsRow
          icon="bulb-outline"
          iconColor="#7B5EA8"
          label={t('feedbackV2.suggestFeature')}
          sublabel={t('feedbackV2.suggestFeatureSub')}
          onPress={() => setShowModal(true)}
          isLast
        />
      </SettingsCard>

      <SectionLabel>{t('feedbackV2.communitySection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="help-circle-outline"
          iconColor="#3B82F6"
          label={t('feedbackV2.helpCenter')}
          value={t('feedbackV2.helpCenterValue')}
          onPress={() => Linking.openURL(HELP_URL)}
        />
        <SettingsRow
          icon="logo-instagram"
          iconColor="#EC4899"
          label={t('feedbackV2.followInstagram')}
          value={t('feedbackV2.followInstagramValue')}
          onPress={() => Linking.openURL(INSTAGRAM_URL)}
        />
        <SettingsRow
          icon="map-outline"
          iconColor={v2.good}
          label={t('feedbackV2.publicRoadmap')}
          onPress={() => Linking.openURL(ROADMAP_URL)}
          isLast
        />
      </SettingsCard>

      <View
        style={{
          marginTop: 18, paddingVertical: 20, paddingHorizontal: 16,
          borderRadius: 16, backgroundColor: v2.bgInk,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 18,
            color: v2.inkOnDark, letterSpacing: -0.3,
            fontStyle: 'italic',
          }}
        >
          {t('feedbackV2.thankYou')}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 11, color: v2.inkOnDarkM,
            marginTop: 6, textAlign: 'center',
          }}
        >
          {t('feedbackV2.thankYouSub')}
        </Text>
      </View>

      <FeedbackModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
